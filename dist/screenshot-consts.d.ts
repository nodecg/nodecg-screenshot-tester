import * as puppeteer from 'puppeteer';
import { Handler } from 'express';
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
    metadata?: {
        [key: string]: any;
    };
}
export interface CustomRoute {
    method: 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
    route: string;
    handler: Handler;
}
export interface ConstsInterface {
    DEFAULT_WIDTH: number;
    DEFAULT_HEIGHT: number;
    PORT: number;
    BUNDLE_NAME: string;
    BUNDLE_ROOT: string;
    BUNDLE_MANIFEST: any;
    BUNDLE_CONFIG: {
        [keys: string]: any;
    };
    FIXTURE_SCREENSHOTS_DIR: string;
    PUPPETEER_LAUNCH_OPTS: puppeteer.LaunchOptions;
    TEST_CASES: TestCase[];
    CUSTOM_ROUTES: CustomRoute[];
}
export declare const CONSTS: ConstsInterface;
