// Packages
import * as Puppeteer from 'puppeteer';

/**
 * Adapted from https://github.com/puppeteer/puppeteer/issues/1353#issuecomment-356561654
 */
export async function waitForNetworkIdle(page: Puppeteer.Page, timeout = 500, maxInflightRequests = 0): Promise<void> {
	page.on('request', onRequestStarted);
	page.on('requestfinished', onRequestFinished);
	page.on('requestfailed', onRequestFinished);

	let inflight = 0;
	let fulfill: () => void;
	const promise: Promise<void> = new Promise(x => {
		fulfill = x;
	});
	let timeoutId = setTimeout(onTimeoutDone, timeout);

	function onTimeoutDone(): void {
		page.removeListener('request', onRequestStarted);
		page.removeListener('requestfinished', onRequestFinished);
		page.removeListener('requestfailed', onRequestFinished);
		fulfill();
	}

	function onRequestStarted(): void {
		++inflight;
		if (inflight > maxInflightRequests) {
			clearTimeout(timeoutId);
		}
	}

	function onRequestFinished(): void {
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
