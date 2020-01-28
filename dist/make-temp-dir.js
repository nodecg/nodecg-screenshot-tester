"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const fs = require("fs");
// Packages
const mkdirp = require("mkdirp");
const tmp = require("tmp");
exports.makeTempDir = (test) => {
    if (process.env.TEST_SCREENSHOT_DIR) {
        if (!fs.existsSync(process.env.TEST_SCREENSHOT_DIR)) {
            mkdirp.sync(process.env.TEST_SCREENSHOT_DIR);
        }
        return process.env.TEST_SCREENSHOT_DIR;
    }
    const tmpobj = tmp.dirSync({ keep: true, unsafeCleanup: true });
    test.after('remove tmp dir', () => {
        if (!process.env.CI || process.env.CI.toLowerCase() !== 'true') {
            tmpobj.removeCallback();
        }
    });
    return tmpobj.name;
};
//# sourceMappingURL=make-temp-dir.js.map