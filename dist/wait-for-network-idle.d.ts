import * as Puppeteer from 'puppeteer';
/**
 * Adapted from https://github.com/puppeteer/puppeteer/issues/1353#issuecomment-356561654
 */
export declare function waitForNetworkIdle(page: Puppeteer.Page, timeout?: number, maxInflightRequests?: number): Promise<void>;
