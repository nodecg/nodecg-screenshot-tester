#!/usr/bin/env node

// Native
import * as fs from 'fs';
import * as path from 'path';

// Packages
import { argv } from 'yargs';
import * as pMap from 'p-map';
import pixelmatch = require('pixelmatch');
import { PNG } from 'pngjs';
import * as puppeteer from 'puppeteer';
import * as tmp from 'tmp';
import * as ProgressBar from 'progress';
import { table } from 'table';
import * as isCi from 'is-ci';
import * as logSymbols from 'log-symbols';
import * as physicalCpuCount from 'physical-cpu-count';

const DEBUG = argv.debug;

// Ours
import * as server from '../screenshot-server';
import { CONSTS, TestCase } from '../screenshot-consts';
import { screenshotGraphic, computeFullTestCaseName, computeTestCaseResolution } from '../screenshot-taker';

const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name;

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

server
	.open()
	.then(async () => {
		const browser = await puppeteer.launch({
			...CONSTS.PUPPETEER_LAUNCH_OPTS,
			headless: !DEBUG,
		});

		const filterRegExp = new RegExp(argv.filter);
		if (argv.filter) {
			console.log('Filter:', filterRegExp);
		}

		const filteredTestCases = CONSTS.TEST_CASES.filter(testCase => {
			const testCaseFileName = computeFullTestCaseName(testCase);
			return filterRegExp.test(testCaseFileName);
		});

		const bar = new ProgressBar('[:bar] :current/:total (:percent) Time elapsed: :elapsed sec', {
			total: filteredTestCases.length,
			width: 31,
		});
		const updateBarInterval = setInterval(() => {
			bar.render();
		}, 100);
		const results: GenerationResult[] = [];

		// Default concurrency to the number of physical cores.
		// Things seem to start breaking if we go higher than that.
		let concurrency = physicalCpuCount;

		// If on CI, always just hardcode to 2 cores.
		// This could maybe be made better later, but for now this is fine for the majority of cases.
		if (isCi) {
			concurrency = 2;
		}

		// If the user provided their own concurrency value, use that.
		if (argv.concurrency) {
			const userProvidedConcurrency = parseInt(argv.concurrency, 10);
			if (userProvidedConcurrency > 0) {
				concurrency = userProvidedConcurrency;
			}
		}

		console.log('Running with a concurrency of:', concurrency);
		console.log('---------------------------------\n');

		await pMap(
			filteredTestCases,
			async (testCase: TestCase) => {
				const testCaseFileName = computeFullTestCaseName(testCase);
				const page = await browser.newPage();
				await page.setViewport(computeTestCaseResolution(testCase));
				await page.evaluateOnNewDocument(() => {
					window.__SCREENSHOT_TESTING__ = true;
				});

				try {
					await screenshotGraphic(page, testCase, {
						destinationDir: tmpDir,
						debug: DEBUG,
					});

					const newScreenshotPath = path.join(tmpDir, `${testCaseFileName}.png`);
					const existingScreenshotPath = path.join(CONSTS.FIXTURE_SCREENSHOTS_DIR, `${testCaseFileName}.png`);

					if (fs.existsSync(existingScreenshotPath)) {
						const unchanged = await areScreenshotsIdentical(newScreenshotPath, existingScreenshotPath);

						if (unchanged) {
							bar.interrupt(`${logSymbols.info} ${testCaseFileName} screenshot unchanged.`);
							results.push({
								name: testCaseFileName,
								result: 'unchanged',
							});
						} else {
							fs.copyFileSync(newScreenshotPath, existingScreenshotPath);
							bar.interrupt(`${logSymbols.warning} ${testCaseFileName} screenshot updated!`);
							results.push({
								name: testCaseFileName,
								result: 'updated',
							});
						}
					} else {
						fs.copyFileSync(newScreenshotPath, existingScreenshotPath);
						bar.interrupt(`${logSymbols.success} ${testCaseFileName} screenshot added!`);
						results.push({
							name: testCaseFileName,
							result: 'added',
						});
					}
				} catch (e) {
					bar.interrupt(`${logSymbols.error} ${testCaseFileName} failed: ${String(e.message)}`);
					results.push({
						name: testCaseFileName,
						result: 'error',
						errorMessage: e.message,
					});
				}

				bar.tick();
			},
			{ concurrency },
		);

		clearInterval(updateBarInterval);
		printReport(results);
		console.log(`\nFixture screenshots can be viewed at:\nfile:///${CONSTS.FIXTURE_SCREENSHOTS_DIR}`);

		if (!DEBUG) {
			server.close();
			browser.close();
		}
	})
	.catch(error => {
		console.error(error);
	});

function printReport(results: GenerationResult[]): void {
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

async function areScreenshotsIdentical(pathA: string, pathB: string): Promise<void | boolean | number> {
	return new Promise(resolve => {
		const rawImageA = fs.readFileSync(pathA);
		const rawImageB = fs.readFileSync(pathB);
		const imageA = new PNG().parse(rawImageA, doneReading);
		const imageB = new PNG().parse(rawImageB, doneReading);

		let filesRead = 0;
		async function doneReading(): Promise<void | boolean | number> {
			// Wait until both files are read.
			if (++filesRead < 2) {
				return;
			}

			if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
				return resolve(false);
			}

			// Do the visual diff.
			const diff = new PNG({ width: imageA.width, height: imageB.height });
			const numDiffPixels = pixelmatch(imageA.data, imageB.data, diff.data, imageA.width, imageA.height, {
				threshold: 0.1,
			});

			return resolve(numDiffPixels === 0);
		}
	});
}
