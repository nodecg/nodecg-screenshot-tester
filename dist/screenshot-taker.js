'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const fs = require("fs");
const path = require("path");
// Ours
const screenshot_consts_1 = require("./screenshot-consts");
const DEFAULT_SELECTOR = 'body';
async function screenshotGraphic(page, { route, nameAppendix = '', selector = DEFAULT_SELECTOR, entranceMethodName = 'enter', entranceMethodArgs = [], additionalDelay = 0, before, replicantPrefills }, { spinner, destinationDir, captureLogs = false, debug = false }) {
    const url = `http://127.0.0.1:${screenshot_consts_1.CONSTS.PORT}/${route}`; // tslint:disable-line:no-http-string
    const screenshotFilename = `${computeFullTestCaseName({ route, nameAppendix })}.png`;
    const screenshotPath = path.join(destinationDir, screenshotFilename);
    let delay = additionalDelay;
    if (process.env.CI && process.env.CI.toLowerCase() === 'true') {
        delay += 0;
    }
    const logs = [];
    if (captureLogs) {
        page.on('console', (msg) => logs.push(msg.text()));
    }
    if (spinner) {
        spinner.text = `Navigating to ${url}...`;
    }
    await page.goto(url);
    if (spinner) {
        spinner.text = 'Setting testing flags...';
    }
    await page.evaluate(() => {
        window.__SCREENSHOT_TESTING__ = true;
    });
    if (spinner) {
        spinner.text = `Waiting until ${selector} is on the page...`;
    }
    await page.waitForSelector(selector);
    const element = await page.$(selector);
    if (!element) {
        spinner.fail(`Could not find ${selector} on the page.`);
        return;
    }
    if (spinner) {
        spinner.text = 'Stubbing APIs...';
    }
    await page.evaluate(() => {
        window.nodecg.playSound = () => { }; // tslint:disable-line:no-empty
    });
    if (before) {
        if (spinner) {
            spinner.text = 'Running "before" method...';
        }
        await before(page, element);
    }
    if (replicantPrefills && Object.keys(replicantPrefills).length > 0) {
        if (spinner) {
            spinner.text = 'Prefilling replicants...';
        }
        const prefilledReplicants = {};
        Object.entries(replicantPrefills).forEach(([key, value = key]) => {
            if (typeof value === 'string') { // tslint:disable-line:early-exit
                const filePath = path.resolve(screenshot_consts_1.CONSTS.BUNDLE_ROOT, 'test/fixtures/replicants', `${encodeURIComponent(key)}.rep`);
                const fileContents = fs.readFileSync(filePath, 'utf-8');
                prefilledReplicants[key] = JSON.parse(fileContents);
            }
            else {
                prefilledReplicants[key] = value;
            }
        });
        await page.evaluate(browserPrefilledReplicants => {
            Object.entries(browserPrefilledReplicants).forEach(([key, value]) => {
                const replicant = window.nodecg.Replicant(key);
                replicant.status = 'declared';
                replicant.value = value;
                console.log('set %s to', key, value);
                replicant.emit('change', value);
            });
        }, prefilledReplicants);
    }
    if (entranceMethodName && selector !== DEFAULT_SELECTOR) {
        if (spinner) {
            spinner.text = 'Waiting for entrance animation to complete...';
        }
        await element.click(); // Necessary to get media to play in some circumstances.
        await page.$eval(selector, (el, browserEntranceMethodName, browserEntranceArgs) => {
            return new Promise(async (resolve) => {
                const entranceMethod = el[browserEntranceMethodName];
                if (typeof entranceMethod !== 'function') {
                    throw new Error(`Entrance method ${browserEntranceMethodName} not found on element.`);
                }
                let entranceResult = entranceMethod.apply(el, browserEntranceArgs);
                // Handle entrance methods which return Promises or GSAP TimelineLite instances.
                if (entranceResult.then && typeof entranceResult.then === 'function') {
                    entranceResult = await entranceResult;
                }
                if (entranceResult instanceof window.TimelineLite || entranceResult instanceof window.TimelineMax) {
                    setTimeout(() => {
                        entranceResult.call(() => {
                            resolve();
                        });
                    }, 250);
                }
                else if (entranceResult instanceof window.TweenLite || entranceResult instanceof window.TweenMax) {
                    const tl = new window.TimelineLite();
                    tl.add(entranceResult);
                    tl.call(() => {
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        }, entranceMethodName, entranceMethodArgs);
    }
    if (delay > 0) {
        if (spinner) {
            spinner.text = `Delaying for ${delay} milliseconds`;
        }
        await sleep(delay);
    }
    if (spinner) {
        spinner.text = 'Taking screenshot...';
    }
    await page.screenshot({
        path: screenshotPath,
        omitBackground: true
    });
    if (captureLogs) {
        if (spinner) {
            spinner.text = 'Saving console logs...';
        }
        const logPath = screenshotPath.replace(/\.png$/, '.log');
        fs.writeFileSync(logPath, logs.join('\n'));
    }
    if (!debug) { // tslint:disable-line:early-exit
        if (spinner) {
            spinner.text = 'Closing page...';
        }
        await page.close();
    }
}
exports.screenshotGraphic = screenshotGraphic;
function computeFullTestCaseName({ route, nameAppendix }) {
    let testName = route.split('/').pop();
    if (nameAppendix) {
        testName += '-' + nameAppendix;
    }
    return testName || '';
}
exports.computeFullTestCaseName = computeFullTestCaseName;
function computeTestCaseResolution(testCase) {
    let width = screenshot_consts_1.CONSTS.DEFAULT_WIDTH;
    let height = screenshot_consts_1.CONSTS.DEFAULT_HEIGHT;
    const graphicManifest = screenshot_consts_1.CONSTS.BUNDLE_MANIFEST.nodecg.graphics.find((graphic) => {
        if (!graphic || typeof graphic !== 'object') {
            return;
        }
        return testCase.route.endsWith(graphic.file);
    });
    if (graphicManifest) {
        width = graphicManifest.width;
        height = graphicManifest.height;
    }
    return { width, height };
}
exports.computeTestCaseResolution = computeTestCaseResolution;
function sleep(milliseconds) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
}
//# sourceMappingURL=screenshot-taker.js.map