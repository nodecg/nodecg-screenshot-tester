"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Adapted from https://github.com/puppeteer/puppeteer/issues/1353#issuecomment-356561654
 */
async function waitForNetworkIdle(page, timeout = 500, maxInflightRequests = 0) {
    page.on('request', onRequestStarted);
    page.on('requestfinished', onRequestFinished);
    page.on('requestfailed', onRequestFinished);
    let inflight = 0;
    let fulfill;
    const promise = new Promise(x => {
        fulfill = x;
    });
    let timeoutId = setTimeout(onTimeoutDone, timeout);
    function onTimeoutDone() {
        page.removeListener('request', onRequestStarted);
        page.removeListener('requestfinished', onRequestFinished);
        page.removeListener('requestfailed', onRequestFinished);
        fulfill();
    }
    function onRequestStarted() {
        ++inflight;
        if (inflight > maxInflightRequests) {
            clearTimeout(timeoutId);
        }
    }
    function onRequestFinished() {
        if (inflight === 0) {
            return;
        }
        --inflight;
        if (inflight === maxInflightRequests) {
            timeoutId = setTimeout(onTimeoutDone, timeout);
        }
    }
    return promise;
}
exports.waitForNetworkIdle = waitForNetworkIdle;
//# sourceMappingURL=wait-for-network-idle.js.map