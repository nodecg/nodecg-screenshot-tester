#!/usr/bin/env node

// Native
import { promises as fs, existsSync } from 'fs';
import * as path from 'path';

// Packages
import * as yargs from 'yargs';
import * as pMap from 'p-map';
import * as puppeteer from 'puppeteer';
import { table } from 'table';
import * as logSymbols from 'log-symbols';

const { argv } = yargs.boolean(['debug', 'update']).string(['definitions']);
const DEBUG = argv.debug;
const TEST_ONLY = !argv.update;
global.testDefPath = path.resolve(argv.definitions);
console.log('Loading test defintions from:\n%s\n', global.testDefPath);
if (!existsSync(global.testDefPath)) {
	console.error('Test definition file does not exist!');
	process.exit(1);
}

if (DEBUG) {
	console.log('Debug ON');
}

if (TEST_ONLY) {
	console.log('Test mode, no files will be overwritten.');
} else {
	console.log('Update mode, updated screenshots will be saved.');
}

// Ours
import { ProgressBar } from '../lib/progress';
import * as server from '../screenshot-server';
import { CONSTS, TestCase } from '../screenshot-consts';
import { screenshotGraphic } from '../screenshot-taker';
import {
	filterTestCases,
	calcTestCaseName,
	calcTestCaseResolution,
	getConcurrency,
	diffImages,
	makeTempDir,
} from '../util';

type GenerationResult = {
	name: string;
} & (
	| {
			result: 'updated' | 'unchanged' | 'added';
	  }
	| {
			result: 'error';
			errorMessage: string;
	  }
);

const { tempDir, cleanupTempDir } = makeTempDir();

main().catch(error => {
	console.error(error);
});

async function main(): Promise<void> {
	await server.open();

	const browser = await puppeteer.launch({
		...CONSTS.PUPPETEER_LAUNCH_OPTS,
		headless: !DEBUG,
	});
	const filteredTestCases = filterTestCases(CONSTS.TEST_CASES, argv.filter);
	const bar = new ProgressBar('[:bar] :current/:total (:percent) Time elapsed: :elapsed sec', {
		total: filteredTestCases.length,
		width: 31,
	});
	const updateBarInterval = setInterval(() => {
		bar.render();
	}, 100);
	const results: GenerationResult[] = [];

	await pMap(
		filteredTestCases,
		async (testCase: TestCase) => {
			const testCaseFileName = calcTestCaseName(testCase);
			const page = await browser.newPage();
			await page.setViewport(calcTestCaseResolution(testCase, CONSTS));
			await page.evaluateOnNewDocument(() => {
				window.__SCREENSHOT_TESTING__ = true;
			});

			try {
				const existingScreenshotPath = path.join(CONSTS.FIXTURE_SCREENSHOTS_DIR, `${testCaseFileName}.png`);
				let existingScreenshot: Buffer | null = null;
				try {
					existingScreenshot = await fs.readFile(existingScreenshotPath);
				} catch (error) {
					if (error.code === 'ENOENT') {
						if (TEST_ONLY) {
							bar.interrupt(`  ${logSymbols.warning} ${testCaseFileName} fixture missing!`);
							results.push({
								name: testCaseFileName,
								result: 'added',
							});
							return;
						}

						// If we're not in TEST_ONLY, we intentionally ignore ENOENT,
						// because we're just going to write a new file there anyway.
					} else {
						throw error;
					}
				}

				await screenshotGraphic(page, testCase, {
					destinationDir: tempDir,
					debug: DEBUG,
				});

				const newScreenshotPath = path.join(tempDir, `${testCaseFileName}.png`);
				const newScreenshot = await fs.readFile(newScreenshotPath);

				if (existingScreenshot) {
					let diff: Buffer | void;
					try {
						diff = await diffImages(newScreenshot, existingScreenshot);
					} catch (error) {
						if (error.message === 'Images are not the same resolution.' && !TEST_ONLY) {
							// Discard this error if we're not doing a test.
						} else {
							throw error;
						}
					}

					if (diff) {
						if (TEST_ONLY) {
							await fs.writeFile(`${tempDir}/_DIFF-${testCaseFileName}.png`, diff);
							bar.interrupt(`  ${logSymbols.error} ${testCaseFileName} screenshot does not match!`);
						} else {
							await fs.writeFile(existingScreenshotPath, newScreenshot);
							bar.interrupt(`  ${logSymbols.warning} ${testCaseFileName} screenshot updated!`);
						}

						results.push({
							name: testCaseFileName,
							result: 'updated',
						});
					} else {
						if (TEST_ONLY) {
							bar.interrupt(`  ${logSymbols.success} ${testCaseFileName} passed.`);
						} else {
							bar.interrupt(`  ${logSymbols.info} ${testCaseFileName} screenshot unchanged.`);
						}

						results.push({
							name: testCaseFileName,
							result: 'unchanged',
						});
					}
				} else {
					await fs.writeFile(existingScreenshotPath, newScreenshot);
					bar.interrupt(`  ${logSymbols.success} ${testCaseFileName} screenshot added!`);
					results.push({
						name: testCaseFileName,
						result: 'added',
					});
				}
			} catch (e) {
				bar.interrupt(`  ${logSymbols.error} ${testCaseFileName} errored: ${String(e.message)}`);
				results.push({
					name: testCaseFileName,
					result: 'error',
					errorMessage: e.message,
				});
			}

			bar.tick();
		},
		{ concurrency: DEBUG ? 1 : getConcurrency() },
	);

	clearInterval(updateBarInterval);
	if (TEST_ONLY) {
		printTestReport(results);
	} else {
		printGenerationReport(results);
		console.log(`\nFixture screenshots can be viewed at:\nfile:///${CONSTS.FIXTURE_SCREENSHOTS_DIR}`);
	}

	if (!DEBUG) {
		cleanupTempDir();
		server.close();
		browser.close();
	}
}

function printGenerationReport(results: GenerationResult[]): void {
	const data = [
		[`${logSymbols.success} Added`, results.filter(({ result }) => result === 'added').length],
		[`${logSymbols.warning} Updated`, results.filter(({ result }) => result === 'updated').length],
		[`${logSymbols.info} Unchanged`, results.filter(({ result }) => result === 'unchanged').length],
		[`${logSymbols.error} Errored`, results.filter(({ result }) => result === 'error').length],
	];
	const output = table(data, {
		columns: {
			0: {
				alignment: 'left',
				width: 11,
			},
			1: {
				alignment: 'left',
				width: 3,
			},
		},
	});

	console.log('');
	console.log(output);
}

function printTestReport(results: GenerationResult[]): void {
	const data = [
		[`${logSymbols.success} Passed`, results.filter(({ result }) => result === 'unchanged').length],
		[`${logSymbols.warning} Missing`, results.filter(({ result }) => result === 'added').length],
		[`${logSymbols.error} Failed`, results.filter(({ result }) => result === 'updated').length],
		[`${logSymbols.error} Errored`, results.filter(({ result }) => result === 'error').length],
	];
	const output = table(data, {
		columns: {
			0: {
				alignment: 'left',
				width: 11,
			},
			1: {
				alignment: 'left',
				width: 3,
			},
		},
	});

	console.log('');
	console.log(output);
}
