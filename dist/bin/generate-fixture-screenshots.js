#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const fs = require("fs");
const path = require("path");
// Packages
const yargs_1 = require("yargs");
const ora = require("ora");
const pEachSeries = require("p-each-series");
const pixelmatch = require("pixelmatch");
const pngjs_1 = require("pngjs");
const puppeteer = require("puppeteer");
const tmp = require("tmp");
const DEBUG = yargs_1.argv.debug;
// Ours
const server = require("../screenshot-server");
const screenshot_consts_1 = require("../screenshot-consts");
const screenshot_taker_1 = require("../screenshot-taker");
const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name;
server.open().then(async () => {
    const browser = await puppeteer.launch(Object.assign({}, screenshot_consts_1.CONSTS.PUPPETEER_LAUNCH_OPTS, { headless: !DEBUG }));
    await pEachSeries(screenshot_consts_1.CONSTS.TEST_CASES, async (testCase) => {
        const testCaseFileName = screenshot_taker_1.computeFullTestCaseName(testCase);
        const spinner = ora().start();
        const page = await browser.newPage();
        await page.setViewport(screenshot_taker_1.computeTestCaseResolution(testCase));
        try {
            await screenshot_taker_1.screenshotGraphic(page, testCase, {
                spinner,
                destinationDir: tmpDir,
                debug: DEBUG
            });
            const newScreenshotPath = path.join(tmpDir, `${testCaseFileName}.png`);
            const existingScreenshotPath = path.join(screenshot_consts_1.CONSTS.FIXTURE_SCREENSHOTS_DIR, `${testCaseFileName}.png`);
            if (fs.existsSync(existingScreenshotPath)) {
                const unchanged = await areScreenshotsIdentical(newScreenshotPath, existingScreenshotPath);
                if (unchanged) {
                    spinner.info(`${testCaseFileName} screenshot unchanged.`);
                }
                else {
                    spinner.text = 'Screenshot changed, updating fixture...';
                    fs.copyFileSync(newScreenshotPath, existingScreenshotPath);
                    spinner.succeed(`${testCaseFileName} screenshot updated!`);
                }
            }
            else {
                spinner.text = 'Screenshot is new, adding fixture...';
                fs.copyFileSync(newScreenshotPath, existingScreenshotPath);
                spinner.succeed(`${testCaseFileName} screenshot added!`);
            }
        }
        catch (e) {
            spinner.fail(`${testCaseFileName} failed: ${e.message}`);
        }
    });
    console.log(`\nFixture screenshots can be viewed at:\nfile:///${screenshot_consts_1.CONSTS.FIXTURE_SCREENSHOTS_DIR}`);
    if (!DEBUG) {
        server.close();
        browser.close();
    }
});
function areScreenshotsIdentical(pathA, pathB) {
    return new Promise(resolve => {
        const imageA = fs.createReadStream(pathA).pipe(new pngjs_1.PNG()).on('parsed', doneReading);
        const imageB = fs.createReadStream(pathB).pipe(new pngjs_1.PNG()).on('parsed', doneReading);
        let filesRead = 0;
        function doneReading() {
            // Wait until both files are read.
            if (++filesRead < 2) {
                return;
            }
            if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
                return resolve(false);
            }
            // Do the visual diff.
            const diff = new pngjs_1.PNG({ width: imageA.width, height: imageB.height });
            const numDiffPixels = pixelmatch(imageA.data, imageB.data, diff.data, imageA.width, imageA.height, { threshold: 0.1 });
            return resolve(numDiffPixels === 0);
        }
    });
}
//# sourceMappingURL=generate-fixture-screenshots.js.map