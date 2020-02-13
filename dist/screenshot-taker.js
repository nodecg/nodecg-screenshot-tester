"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const fs = require("fs");
const path = require("path");
// Ours
const screenshot_consts_1 = require("./screenshot-consts");
const util_1 = require("./util");
const DEFAULT_SELECTOR = 'body';
async function screenshotGraphic(page, { route, nameAppendix = '', selector = DEFAULT_SELECTOR, entranceMethodName = '', entranceMethodArgs = [], additionalDelay = 0, before, after, replicantPrefills, }, { destinationDir, captureLogs = false, debug = false }) {
    const url = `http://127.0.0.1:${screenshot_consts_1.CONSTS.PORT}/${route}`;
    const screenshotFilename = `${util_1.calcTestCaseName({ route, nameAppendix })}.png`;
    const screenshotPath = path.join(destinationDir, screenshotFilename);
    let delay = additionalDelay;
    if (process.env.CI && process.env.CI.toLowerCase() === 'true') {
        delay += 0;
    }
    const logs = [];
    if (captureLogs) {
        page.on('console', (msg) => logs.push(msg.text()));
    }
    page.goto(url);
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    await page.waitForSelector(selector);
    const element = await page.$(selector);
    if (!element) {
        return;
    }
    await page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        window.nodecg.playSound = () => { };
    });
    if (replicantPrefills && Object.keys(replicantPrefills).length > 0) {
        const prefilledReplicants = {};
        Object.entries(replicantPrefills).forEach(([key, value]) => {
            if (value === undefined) {
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
                // eslint-disable-next-line new-cap
                const replicant = window.nodecg.Replicant(key);
                replicant.status = 'declared';
                replicant.value = value;
                console.log(`set ${key} to`, value);
                replicant.emit('change', value);
            });
        }, prefilledReplicants);
    }
    if (before) {
        await before(page, element);
    }
    if (entranceMethodName && selector !== DEFAULT_SELECTOR) {
        await element.click(); // Necessary to get media to play in some circumstances.
        await page.$eval(selector, async (el, browserEntranceMethodName, browserEntranceArgs) => {
            return new Promise(resolve => {
                const entranceMethod = el[browserEntranceMethodName];
                if (typeof entranceMethod !== 'function') {
                    throw new Error(`Entrance method ${String(browserEntranceMethodName)} not found on element.`);
                }
                let entranceResult = entranceMethod.apply(el, browserEntranceArgs);
                if (entranceResult.then && typeof entranceResult.then === 'function') {
                    // Handle entrance methods which return a Promise.
                    entranceResult.then(() => {
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        }, entranceMethodName, entranceMethodArgs);
    }
    if (after) {
        await after(page, element);
    }
    if (delay > 0) {
        await util_1.sleep(delay);
    }
    await util_1.waitForNetworkIdle(page);
    await page.screenshot({
        path: screenshotPath,
        omitBackground: true,
    });
    if (captureLogs) {
        const logPath = screenshotPath.replace(/\.png$/, '.log');
        fs.writeFileSync(logPath, logs.join('\n'));
    }
    if (!debug) {
        await page.close();
    }
}
exports.screenshotGraphic = screenshotGraphic;
//# sourceMappingURL=screenshot-taker.js.map