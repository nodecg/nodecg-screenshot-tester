#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const fs = require("fs");
const path = require("path");
// Packages
const yargs_1 = require("yargs");
const pMap = require("p-map");
const pixelmatch = require("pixelmatch");
const pngjs_1 = require("pngjs");
const puppeteer = require("puppeteer");
const tmp = require("tmp");
const ProgressBar = require("progress");
const table_1 = require("table");
const isCi = require("is-ci");
const logSymbols = require("log-symbols");
const physicalCpuCount = require("physical-cpu-count");
const DEBUG = yargs_1.argv.debug;
// Ours
const server = require("../screenshot-server");
const screenshot_consts_1 = require("../screenshot-consts");
const screenshot_taker_1 = require("../screenshot-taker");
const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name;
server
    .open()
    .then(async () => {
    const browser = await puppeteer.launch(Object.assign(Object.assign({}, screenshot_consts_1.CONSTS.PUPPETEER_LAUNCH_OPTS), { headless: !DEBUG }));
    const filterRegExp = new RegExp(yargs_1.argv.filter);
    if (yargs_1.argv.filter) {
        console.log('Filter:', filterRegExp);
    }
    const filteredTestCases = screenshot_consts_1.CONSTS.TEST_CASES.filter(testCase => {
        const testCaseFileName = screenshot_taker_1.computeFullTestCaseName(testCase);
        return filterRegExp.test(testCaseFileName);
    });
    const bar = new ProgressBar('[:bar] :current/:total (:percent) Time elapsed: :elapsed sec', {
        total: filteredTestCases.length,
        width: 31,
    });
    const updateBarInterval = setInterval(() => {
        bar.render();
    }, 100);
    const results = [];
    // Default concurrency to the number of physical cores.
    // Things seem to start breaking if we go higher than that.
    let concurrency = physicalCpuCount;
    // If on CI, always just hardcode to 2 cores.
    // This could maybe be made better later, but for now this is fine for the majority of cases.
    if (isCi) {
        concurrency = 2;
    }
    // If the user provided their own concurrency value, use that.
    if (yargs_1.argv.concurrency) {
        const userProvidedConcurrency = parseInt(yargs_1.argv.concurrency, 10);
        if (userProvidedConcurrency > 0) {
            concurrency = userProvidedConcurrency;
        }
    }
    console.log('Running with a concurrency of:', concurrency);
    console.log('---------------------------------\n');
    await pMap(filteredTestCases, async (testCase) => {
        const testCaseFileName = screenshot_taker_1.computeFullTestCaseName(testCase);
        const page = await browser.newPage();
        await page.setViewport(screenshot_taker_1.computeTestCaseResolution(testCase));
        await page.evaluateOnNewDocument(() => {
            window.__SCREENSHOT_TESTING__ = true;
        });
        try {
            await screenshot_taker_1.screenshotGraphic(page, testCase, {
                destinationDir: tmpDir,
                debug: DEBUG,
            });
            const newScreenshotPath = path.join(tmpDir, `${testCaseFileName}.png`);
            const existingScreenshotPath = path.join(screenshot_consts_1.CONSTS.FIXTURE_SCREENSHOTS_DIR, `${testCaseFileName}.png`);
            if (fs.existsSync(existingScreenshotPath)) {
                const unchanged = await areScreenshotsIdentical(newScreenshotPath, existingScreenshotPath);
                if (unchanged) {
                    bar.interrupt(`${logSymbols.info} ${testCaseFileName} screenshot unchanged.`);
                    results.push({
                        name: testCaseFileName,
                        result: 'unchanged',
                    });
                }
                else {
                    fs.copyFileSync(newScreenshotPath, existingScreenshotPath);
                    bar.interrupt(`${logSymbols.warning} ${testCaseFileName} screenshot updated!`);
                    results.push({
                        name: testCaseFileName,
                        result: 'updated',
                    });
                }
            }
            else {
                fs.copyFileSync(newScreenshotPath, existingScreenshotPath);
                bar.interrupt(`${logSymbols.success} ${testCaseFileName} screenshot added!`);
                results.push({
                    name: testCaseFileName,
                    result: 'added',
                });
            }
        }
        catch (e) {
            bar.interrupt(`${logSymbols.error} ${testCaseFileName} failed: ${String(e.message)}`);
            results.push({
                name: testCaseFileName,
                result: 'error',
                errorMessage: e.message,
            });
        }
        bar.tick();
    }, { concurrency });
    clearInterval(updateBarInterval);
    printReport(results);
    console.log(`\nFixture screenshots can be viewed at:\nfile:///${screenshot_consts_1.CONSTS.FIXTURE_SCREENSHOTS_DIR}`);
    if (!DEBUG) {
        server.close();
        browser.close();
    }
})
    .catch(error => {
    console.error(error);
});
function printReport(results) {
    const data = [
        [`${logSymbols.success} Added`, results.filter(({ result }) => result === 'added').length],
        [`${logSymbols.warning} Updated`, results.filter(({ result }) => result === 'updated').length],
        [`${logSymbols.info} Unchanged`, results.filter(({ result }) => result === 'unchanged').length],
        [`${logSymbols.error} Errored`, results.filter(({ result }) => result === 'error').length],
    ];
    const output = table_1.table(data, {
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
async function areScreenshotsIdentical(pathA, pathB) {
    return new Promise(resolve => {
        const rawImageA = fs.readFileSync(pathA);
        const rawImageB = fs.readFileSync(pathB);
        const imageA = new pngjs_1.PNG().parse(rawImageA, doneReading);
        const imageB = new pngjs_1.PNG().parse(rawImageB, doneReading);
        let filesRead = 0;
        async function doneReading() {
            // Wait until both files are read.
            if (++filesRead < 2) {
                return;
            }
            if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
                return resolve(false);
            }
            // Do the visual diff.
            const diff = new pngjs_1.PNG({ width: imageA.width, height: imageB.height });
            const numDiffPixels = pixelmatch(imageA.data, imageB.data, diff.data, imageA.width, imageA.height, {
                threshold: 0.1,
            });
            return resolve(numDiffPixels === 0);
        }
    });
}
//# sourceMappingURL=generate-fixture-screenshots.js.map