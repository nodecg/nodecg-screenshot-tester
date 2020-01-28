#!/usr/bin/env node

// Native
import * as fs from 'fs';
import * as path from 'path';

// Packages
import { argv } from 'yargs';
import * as ora from 'ora';
import pEachSeries = require('p-each-series');
import pixelmatch = require('pixelmatch');
import { PNG } from 'pngjs';
import * as puppeteer from 'puppeteer';
import * as tmp from 'tmp';

const DEBUG = argv.debug;

// Ours
import * as server from '../screenshot-server';
import { CONSTS, TestCase } from '../screenshot-consts';
import { screenshotGraphic, computeFullTestCaseName, computeTestCaseResolution } from '../screenshot-taker';

const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name;

server.open().then(async () => {
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

	await pEachSeries(filteredTestCases, async (testCase: TestCase) => {
		const testCaseFileName = computeFullTestCaseName(testCase);
		const spinner = ora().start();
		const page = await browser.newPage();
		await page.setViewport(computeTestCaseResolution(testCase));
		await page.evaluateOnNewDocument(() => {
			(window as any).__SCREENSHOT_TESTING__ = true;
		});

		try {
			await screenshotGraphic(page, testCase, {
				spinner,
				destinationDir: tmpDir,
				debug: DEBUG,
			});

			const newScreenshotPath = path.join(tmpDir, `${testCaseFileName}.png`);
			const existingScreenshotPath = path.join(CONSTS.FIXTURE_SCREENSHOTS_DIR, `${testCaseFileName}.png`);

			if (fs.existsSync(existingScreenshotPath)) {
				const unchanged = await areScreenshotsIdentical(newScreenshotPath, existingScreenshotPath);

				if (unchanged) {
					spinner.info(`${testCaseFileName} screenshot unchanged.`);
				} else {
					spinner.text = 'Screenshot changed, updating fixture...';
					fs.copyFileSync(newScreenshotPath, existingScreenshotPath);
					spinner.succeed(`${testCaseFileName} screenshot updated!`);
				}
			} else {
				spinner.text = 'Screenshot is new, adding fixture...';
				fs.copyFileSync(newScreenshotPath, existingScreenshotPath);
				spinner.succeed(`${testCaseFileName} screenshot added!`);
			}
		} catch (e) {
			const message: string = e.message;
			spinner.fail(`${testCaseFileName} failed: ${message}`);
		}
	});

	console.log(`\nFixture screenshots can be viewed at:\nfile:///${CONSTS.FIXTURE_SCREENSHOTS_DIR}`);

	if (!DEBUG) {
		server.close();
		browser.close();
	}
});

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
