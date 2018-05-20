'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const fs = require("fs");
const path = require("path");
let BUNDLE_ROOT;
try {
    BUNDLE_ROOT = findBundleRoot(__dirname);
}
catch (_a) {
    BUNDLE_ROOT = findBundleRoot(process.cwd());
}
/* tslint:disable:no-var-requires */
const constsFromBundle = require(path.join(BUNDLE_ROOT, 'test/helpers/screenshot-consts'));
const bundleManifest = require(path.join(BUNDLE_ROOT, 'package.json'));
const baseConsts = {
    DEFAULT_WIDTH: 1920,
    DEFAULT_HEIGHT: 1080,
    PORT: 4000,
    BUNDLE_NAME: bundleManifest.name,
    BUNDLE_ROOT,
    BUNDLE_MANIFEST: bundleManifest,
    BUNDLE_CONFIG: {},
    FIXTURE_SCREENSHOTS_DIR: path.join(BUNDLE_ROOT, 'test/fixtures/screenshots'),
    PUPPETEER_LAUNCH_OPTS: {
        headless: true,
        args: [
            '--disable-gpu',
            '--autoplay-policy=no-user-gesture-required'
        ]
    }
};
exports.CONSTS = Object.assign({}, baseConsts, constsFromBundle);
function findBundleRoot(dir) {
    const packageJsonPath = path.join(dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = require(packageJsonPath);
        if (packageJson.nodecg) {
            return path.dirname(packageJsonPath);
        }
    }
    const nextDir = path.resolve(dir, '..');
    if (nextDir === dir) {
        throw new Error('could not find bundle root');
    }
    return findBundleRoot(nextDir);
}
//# sourceMappingURL=screenshot-consts.js.map