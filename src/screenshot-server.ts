'use strict';

// Native
import * as fs from 'fs';
import * as path from 'path';
import {Server} from 'http';

// Packages
import * as cheerio from 'cheerio';
import * as express from 'express';

// Ours
import {CONSTS} from './screenshot-consts';

const app = express();

app.get(`/bundles/${CONSTS.BUNDLE_NAME}/graphics*`, (req, res, next) => {
	const isGraphicRoute = CONSTS.TEST_CASES.find((testCase: any) => {
		return testCase && req.url.endsWith(testCase.route);
	});

	if (isGraphicRoute) {
		const resName = req.params[0];
		const fileLocation = path.join(CONSTS.BUNDLE_ROOT, 'graphics', resName);

		const html = fs.readFileSync(fileLocation, 'utf-8');
		const $ = cheerio.load(html);

		const scripts = [
			'<script src="/mock-nodecg.js"></script>',
			`<script>window.nodecg = new NodeCG({bundleName: '${CONSTS.BUNDLE_NAME}'})</script>`,
			`<script>window.nodecg.bundleConfig = ${JSON.stringify(CONSTS.BUNDLE_CONFIG)};</script>`
		];

		const scriptsString = scripts.join('\n');

		// Put our scripts before their first script or HTML import.
		// If they have no scripts or imports, put our scripts at the end of <body>.
		const theirScriptsAndImports = $('script, link[rel="import"]');
		if (theirScriptsAndImports.length > 0) {
			theirScriptsAndImports.first().before(scriptsString);
		} else {
			$('body').append(scriptsString);
		}

		return res.send($.html());
	}

	return next();
});

app.use(`/bundles/${CONSTS.BUNDLE_NAME}`, express.static(CONSTS.BUNDLE_ROOT));
app.use(
	`/bundles/${CONSTS.BUNDLE_NAME}/test/fixtures/static`,
	express.static(path.resolve(CONSTS.BUNDLE_ROOT, 'test/fixtures/static'))
);

app.use('/mock-nodecg.js', async (_req, res) => {
	const mockNodecgDir = path.parse(require.resolve('mock-nodecg')).dir;
	return res.sendFile(
		path.join(mockNodecgDir, 'dist/mock-nodecg.js')
	);
});

let serverReference: Server;
let opened = false;
export const open = () => {
	return new Promise((resolve, reject) => {
		if (opened) {
			reject(new Error('server is already opened'));
			return;
		}

		serverReference = app.listen(CONSTS.PORT, (error: NodeJS.ErrnoException) => {
			if (error) {
				reject(error);
			} else {
				opened = true;
				resolve(serverReference);
			}
		});
	});
};

export const close = () => {
	return serverReference && serverReference.close();
};
