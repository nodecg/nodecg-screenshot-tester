import * as Puppeteer from 'puppeteer';
import { TestCase } from './screenshot-consts';
export interface ScreenshotOptions {
    destinationDir: string;
    captureLogs?: boolean;
    debug?: boolean;
}
export declare function screenshotGraphic(page: Puppeteer.Page, { route, nameAppendix, selector, entranceMethodName, entranceMethodArgs, additionalDelay, before, after, replicantPrefills, }: TestCase, { destinationDir, captureLogs, debug }: ScreenshotOptions): Promise<void>;
