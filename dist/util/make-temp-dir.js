"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const fs = require("fs");
// Packages
const mkdirp = require("mkdirp");
const tmp = require("tmp");
const noop = () => {
    return undefined;
};
exports.makeTempDir = () => {
    if (process.env.TEST_SCREENSHOT_DIR) {
        if (!fs.existsSync(process.env.TEST_SCREENSHOT_DIR)) {
            mkdirp.sync(process.env.TEST_SCREENSHOT_DIR);
        }
        return {
            tempDir: process.env.TEST_SCREENSHOT_DIR,
            cleanupTempDir: noop,
        };
    }
    const tmpobj = tmp.dirSync({ keep: true, unsafeCleanup: true });
    return {
        tempDir: tmpobj.name,
        cleanupTempDir: () => {
            if (!process.env.CI || process.env.CI.toLowerCase() !== 'true') {
                tmpobj.removeCallback();
            }
        },
    };
};
//# sourceMappingURL=make-temp-dir.js.map