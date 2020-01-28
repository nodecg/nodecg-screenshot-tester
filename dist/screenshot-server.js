"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const fs = require("fs");
const path = require("path");
// Packages
const cheerio = require("cheerio");
const express = require("express");
const express_transform_bare_module_specifiers_1 = require("express-transform-bare-module-specifiers");
// Ours
const screenshot_consts_1 = require("./screenshot-consts");
const app = express();
app.get(`/bundles/${screenshot_consts_1.CONSTS.BUNDLE_NAME}/graphics*`, (req, res, next) => {
    const isGraphicRoute = screenshot_consts_1.CONSTS.TEST_CASES.find((testCase) => {
        return testCase && req.url.endsWith(testCase.route);
    });
    if (isGraphicRoute) {
        const resName = req.params[0];
        const fileLocation = path.join(screenshot_consts_1.CONSTS.BUNDLE_ROOT, 'graphics', resName);
        const html = fs.readFileSync(fileLocation, 'utf-8');
        const $ = cheerio.load(html);
        const scripts = [
            '<script src="/mock-nodecg.js"></script>',
            `<script>window.nodecg = new NodeCG({bundleName: '${screenshot_consts_1.CONSTS.BUNDLE_NAME}'})</script>`,
            `<script>window.nodecg.bundleConfig = ${JSON.stringify(screenshot_consts_1.CONSTS.BUNDLE_CONFIG)};</script>`,
        ];
        const scriptsString = scripts.join('\n');
        // Put our scripts before their first script or HTML import.
        // If they have no scripts or imports, put our scripts at the end of <body>.
        const theirScriptsAndImports = $('script, link[rel="import"]');
        if (theirScriptsAndImports.length > 0) {
            theirScriptsAndImports.first().before(scriptsString);
        }
        else {
            $('body').append(scriptsString);
        }
        return res.send($.html());
    }
    return next();
});
if (screenshot_consts_1.CONSTS.BUNDLE_MANIFEST.nodecg.transformBareModuleSpecifiers) {
    app.use(`/bundles/${screenshot_consts_1.CONSTS.BUNDLE_NAME}/*`, express_transform_bare_module_specifiers_1.default({
        rootDir: process.env.NODECG_ROOT,
        modulesUrl: `/bundles/${screenshot_consts_1.CONSTS.BUNDLE_NAME}/node_modules`,
    }));
}
app.use(`/bundles/${screenshot_consts_1.CONSTS.BUNDLE_NAME}`, express.static(screenshot_consts_1.CONSTS.BUNDLE_ROOT));
app.use(`/bundles/${screenshot_consts_1.CONSTS.BUNDLE_NAME}/test/fixtures/static`, express.static(path.resolve(screenshot_consts_1.CONSTS.BUNDLE_ROOT, 'test/fixtures/static')));
app.use('/mock-nodecg.js', async (_req, res) => {
    const mockNodecgDir = path.parse(require.resolve('mock-nodecg')).dir;
    return res.sendFile(path.join(mockNodecgDir, 'dist/mock-nodecg.js'));
});
if (Array.isArray(screenshot_consts_1.CONSTS.CUSTOM_ROUTES)) {
    screenshot_consts_1.CONSTS.CUSTOM_ROUTES.forEach(({ method, route, handler }) => {
        app[method](route, handler);
    });
}
let serverReference;
let opened = false;
exports.open = async () => {
    return new Promise((resolve, reject) => {
        if (opened) {
            reject(new Error('server is already opened'));
            return;
        }
        serverReference = app.listen(screenshot_consts_1.CONSTS.PORT, (error) => {
            if (error) {
                reject(error);
            }
            else {
                opened = true;
                resolve(serverReference);
            }
        });
    });
};
exports.close = () => {
    var _a;
    return (_a = serverReference) === null || _a === void 0 ? void 0 : _a.close();
};
//# sourceMappingURL=screenshot-server.js.map