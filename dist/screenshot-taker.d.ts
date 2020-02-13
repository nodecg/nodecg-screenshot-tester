import { TestCase } from './screenshot-consts';
import * as Puppeteer from 'puppeteer';
export interface ScreenshotOptions {
    destinationDir: string;
    captureLogs?: boolean;
    debug?: boolean;
}
export declare function screenshotGraphic(page: Puppeteer.Page, { route, nameAppendix, selector, entranceMethodName, entranceMethodArgs, additionalDelay, before, after, replicantPrefills, }: TestCase, { destinationDir, captureLogs, debug }: ScreenshotOptions): Promise<void>;
export declare function computeFullTestCaseName({ route, nameAppendix }: {
    route: string;
    nameAppendix?: string;
}): string;
export declare function computeTestCaseResolution(testCase: TestCase): {
    width: number;
    height: number;
};
