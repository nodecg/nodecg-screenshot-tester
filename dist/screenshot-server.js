'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const fs = require("fs");
const path = require("path");
// Packages
const cheerio = require("cheerio");
const express = require("express");
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
            `<script>window.nodecg.bundleConfig = ${JSON.stringify(screenshot_consts_1.CONSTS.BUNDLE_CONFIG)};</script>`
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
app.get(`/${screenshot_consts_1.CONSTS.BUNDLE_NAME}/cache/:digest`, (req, res, next) => {
    let fileName = req.params.digest;
    const variant = req.query.variant;
    if (variant) {
        fileName += `_${variant}`;
    }
    const fileLocation = path.join(screenshot_consts_1.CONSTS.BUNDLE_ROOT, 'test/fixtures/images', `${fileName}.png`);
    res.sendFile(fileLocation, (err) => {
        if (!err) {
            return;
        }
        if (err.code === 'ENOENT') {
            return res.sendStatus(404);
        }
        return next();
    });
});
app.get(`/${screenshot_consts_1.CONSTS.BUNDLE_NAME}/checkCache`, async (req, res) => {
    if (!req.query.hashes || typeof req.query.hashes !== 'string') {
        return res.sendStatus(400);
    }
    const hashes = req.query.hashes.split(',');
    const variants = req.query.variants ? req.query.variants.split(',') : [];
    const results = hashes.map((hash, index) => {
        return fs.existsSync(path.join(screenshot_consts_1.CONSTS.BUNDLE_ROOT, 'test/fixtures/images', `${hash}_${variants[index]}.png`));
    });
    return res.send(results);
});
app.use(`/bundles/${screenshot_consts_1.CONSTS.BUNDLE_NAME}`, express.static(screenshot_consts_1.CONSTS.BUNDLE_ROOT));
app.use('/mock-nodecg.js', async (_req, res) => {
    const mockNodecgDir = path.parse(require.resolve('mock-nodecg')).dir;
    return res.sendFile(path.join(mockNodecgDir, 'dist/mock-nodecg.js'));
});
let serverReference;
let opened = false;
exports.open = () => {
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
    return serverReference && serverReference.close();
};
//# sourceMappingURL=screenshot-server.js.map