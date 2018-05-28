'use strict';

// Native
import * as fs from 'fs';

// Packages
import pixelmatch = require('pixelmatch');
import {PNG} from 'pngjs';
import * as puppeteer from 'puppeteer';
import * as ava from 'ava';

// Ours
import * as server from './screenshot-server';
import {screenshotGraphic, computeFullTestCaseName, computeTestCaseResolution} from './screenshot-taker';
import {CONSTS, TestCase} from './screenshot-consts';
import {makeTempDir} from './make-temp-dir';

export const comparisonTests = (test: ava.TestInterface) => {
	const tempDir = makeTempDir(test);
	let _browser: puppeteer.Browser;
	test.before(async () => {
		console.log('temp dir:', tempDir);
		await server.open();
		_browser = await puppeteer.launch(CONSTS.PUPPETEER_LAUNCH_OPTS);
	});

	test.after.always(() => {
		server.close();

		if (_browser) {
			_browser.close();
		}
	});

	CONSTS.TEST_CASES.forEach((testCase: TestCase) => {
		const testName = computeFullTestCaseName(testCase);
		test.serial(testName as any, async t => {
			const page = await _browser.newPage();
			await page.setViewport(computeTestCaseResolution(testCase));
			await page.evaluateOnNewDocument(() => {
				(window as any).__SCREENSHOT_TESTING__ = true;
			});

			await screenshotGraphic(page, testCase, {
				captureLogs: true,
				destinationDir: tempDir
			});

			const fileName = computeFullTestCaseName(testCase);
			return compareScreenshots(t, fileName);
		});
	});

	function compareScreenshots(t: ava.ExecutionContext, fileName: string) {
		return new Promise(resolve => {
			const resultImage = fs
				.createReadStream(`${tempDir}/${fileName}.png`)
				.pipe(new PNG()).on('parsed', doneReading);

			const fixtureImage = fs
				.createReadStream(`${CONSTS.FIXTURE_SCREENSHOTS_DIR}/${fileName}.png`)
				.pipe(new PNG()).on('parsed', doneReading);

			let filesRead = 0;
			function doneReading() {
				// Wait until both files are read.
				if (++filesRead < 2) {
					return;
				}

				// The files should be the same size.
				t.is(resultImage.width, fixtureImage.width, 'image widths are the same');
				t.is(resultImage.height, fixtureImage.height, 'image heights are the same');

				// Do the visual diff.
				const diff = new PNG({width: resultImage.width, height: fixtureImage.height});
				const numDiffPixels = pixelmatch(
					resultImage.data, fixtureImage.data, diff.data, resultImage.width, resultImage.height,
					{threshold: 0.1}
				);

				if (numDiffPixels > 0) {
					fs.writeFileSync(`${tempDir}/_DIFF-${fileName}.png`, PNG.sync.write(diff));
				}

				// The files should look the same.
				t.is(numDiffPixels, 0, 'number of different pixels');
				resolve();
			}
		});
	}
};
