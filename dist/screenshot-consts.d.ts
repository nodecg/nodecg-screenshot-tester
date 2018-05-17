import * as puppeteer from 'puppeteer';
export interface TestCase {
    route: string;
    nameAppendix?: string;
    selector?: string;
    additionalDelay?: number;
    entranceMethodName?: string;
    entranceMethodArgs?: any[];
    replicantPrefills?: {
        [key: string]: any;
    };
    before?: Function;
}
export interface ConstsInterface {
    WIDTH: number;
    HEIGHT: number;
    PORT: number;
    BUNDLE_NAME: string;
    BUNDLE_ROOT: string;
    BUNDLE_CONFIG: {
        [keys: string]: any;
    };
    FIXTURE_SCREENSHOTS_DIR: string;
    PUPPETEER_LAUNCH_OPTS: puppeteer.LaunchOptions;
    TEST_CASES: TestCase[];
}
export declare const CONSTS: ConstsInterface;
