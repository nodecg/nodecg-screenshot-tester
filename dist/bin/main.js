#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const fs_1 = require("fs");
const path = require("path");
// Packages
const yargs = require("yargs");
const pMap = require("p-map");
const puppeteer = require("puppeteer");
const table_1 = require("table");
const logSymbols = require("log-symbols");
const { argv } = yargs.boolean(['debug', 'update']).string(['definitions']);
const DEBUG = argv.debug;
const TEST_ONLY = !argv.update;
global.testDefPath = path.resolve(argv.definitions);
console.log('Loading test defintions from:\n%s\n', global.testDefPath);
if (!fs_1.existsSync(global.testDefPath)) {
    console.error('Test definition file does not exist!');
    process.exit(1);
}
if (DEBUG) {
    console.log('Debug ON');
}
if (TEST_ONLY) {
    console.log('Test mode, no files will be overwritten.');
}
else {
    console.log('Update mode, updated screenshots will be saved.');
}
// Ours
const progress_1 = require("../lib/progress");
const server = require("../screenshot-server");
const screenshot_consts_1 = require("../screenshot-consts");
const screenshot_taker_1 = require("../screenshot-taker");
const util_1 = require("../util");
const { tempDir, cleanupTempDir } = util_1.makeTempDir();
main().catch(error => {
    console.error(error);
});
async function main() {
    await server.open();
    const browser = await puppeteer.launch(Object.assign(Object.assign({}, screenshot_consts_1.CONSTS.PUPPETEER_LAUNCH_OPTS), { headless: !DEBUG }));
    const filteredTestCases = util_1.filterTestCases(screenshot_consts_1.CONSTS.TEST_CASES, argv.filter);
    const bar = new progress_1.ProgressBar('[:bar] :current/:total (:percent) Time elapsed: :elapsed sec', {
        total: filteredTestCases.length,
        width: 31,
    });
    const updateBarInterval = setInterval(() => {
        bar.render();
    }, 100);
    const results = [];
    await pMap(filteredTestCases, async (testCase) => {
        const testCaseFileName = util_1.calcTestCaseName(testCase);
        const page = await browser.newPage();
        await page.setViewport(util_1.calcTestCaseResolution(testCase, screenshot_consts_1.CONSTS));
        await page.evaluateOnNewDocument(() => {
            window.__SCREENSHOT_TESTING__ = true;
        });
        try {
            const existingScreenshotPath = path.join(screenshot_consts_1.CONSTS.FIXTURE_SCREENSHOTS_DIR, `${testCaseFileName}.png`);
            let existingScreenshot = null;
            try {
                existingScreenshot = await fs_1.promises.readFile(existingScreenshotPath);
            }
            catch (error) {
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
                }
                else {
                    throw error;
                }
            }
            await screenshot_taker_1.screenshotGraphic(page, testCase, {
                destinationDir: tempDir,
                debug: DEBUG,
            });
            const newScreenshotPath = path.join(tempDir, `${testCaseFileName}.png`);
            const newScreenshot = await fs_1.promises.readFile(newScreenshotPath);
            if (existingScreenshot) {
                let diff;
                try {
                    diff = await util_1.diffImages(newScreenshot, existingScreenshot);
                }
                catch (error) {
                    if (error.message === 'Images are not the same resolution.' && !TEST_ONLY) {
                        // Discard this error if we're not doing a test.
                    }
                    else {
                        throw error;
                    }
                }
                if (diff) {
                    if (TEST_ONLY) {
                        await fs_1.promises.writeFile(`${tempDir}/_DIFF-${testCaseFileName}.png`, diff);
                        bar.interrupt(`  ${logSymbols.error} ${testCaseFileName} screenshot does not match!`);
                    }
                    else {
                        await fs_1.promises.writeFile(existingScreenshotPath, newScreenshot);
                        bar.interrupt(`  ${logSymbols.warning} ${testCaseFileName} screenshot updated!`);
                    }
                    results.push({
                        name: testCaseFileName,
                        result: 'updated',
                    });
                }
                else {
                    if (TEST_ONLY) {
                        bar.interrupt(`  ${logSymbols.success} ${testCaseFileName} passed.`);
                    }
                    else {
                        bar.interrupt(`  ${logSymbols.info} ${testCaseFileName} screenshot unchanged.`);
                    }
                    results.push({
                        name: testCaseFileName,
                        result: 'unchanged',
                    });
                }
            }
            else {
                await fs_1.promises.writeFile(existingScreenshotPath, newScreenshot);
                bar.interrupt(`  ${logSymbols.success} ${testCaseFileName} screenshot added!`);
                results.push({
                    name: testCaseFileName,
                    result: 'added',
                });
            }
        }
        catch (e) {
            bar.interrupt(`  ${logSymbols.error} ${testCaseFileName} errored: ${String(e.message)}`);
            results.push({
                name: testCaseFileName,
                result: 'error',
                errorMessage: e.message,
            });
        }
        bar.tick();
    }, { concurrency: DEBUG ? 1 : util_1.getConcurrency() });
    clearInterval(updateBarInterval);
    if (TEST_ONLY) {
        printTestReport(results);
    }
    else {
        printGenerationReport(results);
        console.log(`\nFixture screenshots can be viewed at:\nfile:///${screenshot_consts_1.CONSTS.FIXTURE_SCREENSHOTS_DIR}`);
    }
    if (!DEBUG) {
        cleanupTempDir();
        server.close();
        browser.close();
    }
    if (TEST_ONLY && !DEBUG) {
        const numFailures = results.filter(result => {
            return result.result === 'error' || result.result === 'updated';
        });
        if (numFailures.length > 0) {
            process.exit(1);
        }
    }
}
function printGenerationReport(results) {
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
function printTestReport(results) {
    const data = [
        [`${logSymbols.success} Passed`, results.filter(({ result }) => result === 'unchanged').length],
        [`${logSymbols.warning} Missing`, results.filter(({ result }) => result === 'added').length],
        [`${logSymbols.error} Failed`, results.filter(({ result }) => result === 'updated').length],
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
//# sourceMappingURL=main.js.map