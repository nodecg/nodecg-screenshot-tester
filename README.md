# nodecg-screenshot-tester [![npm version](https://img.shields.io/npm/v/nodecg-screenshot-tester.svg)](https://npm.im/nodecg-screenshot-tester) [![license](https://img.shields.io/npm/l/nodecg-screenshot-tester.svg)](https://npm.im/nodecg-screenshot-tester) [![Build Status](https://travis-ci.com/nodecg/nodecg-screenshot-tester.svg?branch=master)](https://travis-ci.com/nodecg/nodecg-screenshot-tester)

> Automated visual regression testing of NodeCG graphics.

## Motivation

It's difficult to write tests for NodeCG graphics, or really any broadcast graphics in general. With `nodecg-screenshot-tester`, screenshot tests can often be made very quickly, and for a wide variety of cases for each of your bundle's graphics.

Screenshot tests aren't a complete solution, but they're pretty useful and are better than nothing. Ideally, you'd use them alongside traditional unit and integration tests.

## Demo

![Demo Image](media/demo.gif)

## Table of Contents

-   [Requirements](#requirements)
-   [How do I use it in my bundle?](#bundle-usage)
-   [Can I delay the screenshot?](#delay)
-   [How do I populate Replicants for testing?](#populating-replicants)
-   [What if my graphic relies on HTTP routes not provided by `nodecg-screenshot-tester`?](#custom-routes)
-   [Can I run arbitrary code as part of my test, such as playing animations?](#arbitrary-code)
-   [How do I run only a subset of my test cases?](#filter-cases)
-   [How do I author my test definitions in TypeScript?](#typescript)
-   [Are there other things I can do in my test cases?](#other)

## <a name="requirements"></a> Requirements

-   A NodeCG bundle with graphics you'd like to test
-   Node.js 10 or newer

## <a name="bundle-usage"></a> How do I use it in my bundle?

To be completely blunt, the API for this is quirky and probably could be improved. But, it does work and has been successfully used for major broadcasts.

1. Add `nodecg-screenshot-tester` and `puppeteer` as a devDependencies in your bundle:

    ```bash
    npm i -D nodecg-screenshot-tester puppeteer
    ```

2. Add these scripts to the `scripts` stanza in your bundle's `package.json` :

    ```json
    {
    	"scripts": {
    		"test-screenshots": "nodecg-screenshot-tester --definitions test/screenshots.js",
    		"update-screenshots": "npm run test-screenshots -- --update",
    		"debug-screenshots": "npm run test-screenshots -- --debug"
    	}
    }
    ```

3. Create a `test/screenshots.js` file, which is where your test cases will be defined:

    ```js
    // nodecg/bundles/your-bundle/test/screenshots.js
    module.exports = {
    	TEST_CASES: [
    		{
    			route: 'bundles/your-bundle/graphics/example.html',
    		},
    	],
    };
    ```

    This is the most simple possible example. All it will do is load `example.html` and take a screenshot of it. It won't try to run any of your animations or set values in any of your replicants. Those things require extra configuration, which we will cover later.

4. Generate the "fixture" screenshots. These are the references used to determine if a test passes or fails:

    ```bash
    npm run update-screenshots
    ```

    If you're having troubles with this step, you can run `npm run debug-screenshots`, which will disable headless mode in Puppeteer, allowing you to see and interact with the Chromium instance being used to take the screenshots.

    > ❗ Note that your graphics may render differently when using `debug-screenshots`. Only use this command for debugging, and always use the normal `update-screenshots` to create your final, completed fixtures. Do not commit screenshots generated by `debug-screenshots`.

5. Review your fixture screenshots, to ensure that they show what you want and don't have any issues.

    > ❗ This library doesn't know if your screenshots are good or not. All it knows is if the screenshots it takes during `npm run test-screenshots` match the screesnhots in your `test/fixtures/screenshots` folder. It is up to you to ensure that your fixtures are actually correct.

6. Run the actual tests:

    ```bash
    npm run test-screenshots
    ```

7. With any luck, you will now have one passing screenshot test! 🙌

## <a name="delay"></a> Can I delay the screenshot?

Yes! Just add an `additionalDelay` key to your test case.

However, try to avoid leaning on this if you can. Needing to use this is often a sign that your graphic is too hard to test, and could benefit from some refactoring.

##### Example:

```js
// nodecg/bundles/your-bundle/test/screenshots.js
module.exports = {
	TEST_CASES: [
		{
			route: 'bundles/your-bundle/graphics/example.html',
			additionalDelay: 1000, // Delays for 1000 milliseconds after the page has finished loading.
		},
		{
			route: 'bundles/your-bundle/graphics/example2.html',
			before() {
				console.log('executed before');
			}
			additionalDelay: 1000, // Delays for 1000 milliseconds after `before` has resolved.
		},
	],
};
```

## <a name="populating-replicants"></a> How do I populate Replicants for testing?

If your test case specifies a `replicantPrefills` object, it will populate those Replicants with the specified values before running your entrance method (if defined) and taking the screenshot.

You can even put your Replicant values in a file on disk and have `nodecg-screenshot-tester` load them for you.

##### Example:

```js
// nodecg/bundles/your-bundle/test/screenshots.js
module.exports = {
	TEST_CASES: [
		{
			route: 'bundles/your-bundle/graphics/example.html',
			replicantPrefills: {
				exampleReplicant: 'The "exampleReplicant" replicant will be given a string value',
				arrayExample: ['this', 'one', 'will', 'have', 'an', 'array', 'value'],
				objectExample: { objects: 'are', okay: 'too!' },

				fixtureExample: undefined, // <- "undefined" is a special value!
				// This special value tells `nodecg-screenshot-tester` to load the value from the
				// nodecg/bundles/your-bundle/test/fixtures/replicants/fixtureExample.rep file on disk.
			},
		},
	],
};
```

## <a name="custom-routes"></a> What if my graphic relies on HTTP routes not provided by `nodecg-screenshot-tester`?

You can provide a `CUSTOM_ROUTES` key in your screenshot definitions export. Routes are handled by [`express`](https://expressjs.com/), so refer to its docs for more details on how to write a route.

##### Example:

```js
// nodecg/bundles/your-bundle/test/screenshots.js
module.exports = {
	CUSTOM_ROUTES: [
		{
			method: 'get',
			route: `/your-bundle/cache/:digest`,
			handler: (req, res, next) => {
				// Lange: This is a real example from a super secret bundle I made for a client!
				let fileName = req.params.digest;

				const variant = req.query.variant;
				if (variant) {
					fileName += `_${variant}`;
				}

				const fileLocation = path.join(BUNDLE_ROOT, 'test/fixtures/images', `${fileName}.png`);
				res.sendFile(fileLocation, err => {
					if (!err) {
						return;
					}

					if (err.code === 'ENOENT') {
						return res.sendStatus(404);
					}

					return next();
				});
			},
		},
		{
			method: 'post',
			route: `/your-bundle/example-post-route`,
			handler: async (req, res) => {
				// Logic goes here.
				// Note that we made this one an async method! Anything goes. :)
			},
		},
	],
	TEST_CASES: [
		{
			route: 'bundles/your-bundle/graphics/example.html',
		},
	],
};
```

## <a name="arbitrary-code"></a> Can I run arbitrary code as part of my test, such as playing animations?

Yes! You can provide `before` and `after` methods in your test case. `before` runs before the screenshot is taken, and `after` runs after the screenshot is taken.

`before` and `after` methods should accept two arguments: `page` and `element`. These methods run in the Node.js server context, but you can easily run code in the Chromium browser context via methods such as [`page.evaluate`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageevaluatepagefunction-args).

`page` is the [Puppeteer Page](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page) instance for this particular test case. This gives you full access to the Puppeteer API to do whatever you need to do on your page to get it ready for a screenshot. Every test case is run on its own page. Things you do in one page will not affect other test cases.

`element` is an optional argument which will only be defined if your test case specified a `selector`. If your selector was found on the page, `element` will be the [Puppeteer ElementHandle](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-elementhandle) for your element.

Your `before` and `after` methods may return a Promise, which also means it can be an `async` method!

> 🧦 Do you use [GSAP](https://greensock.com/) to write your animations? [As of version 3](https://greensock.com/3-migration/), GSAP timelines and tweens are all `thenable`, meaning that `nodecg-screenshot-tester` can await them the same way it would any normal Promise! Just have your `before` method return a GSAP animation, and it'll wait until that animation has completed before taking the screenshot.

##### Example:

```js
// nodecg/bundles/your-bundle/test/screenshots.js
module.exports = {
	TEST_CASES: [
		{
			route: 'bundles/your-bundle/graphics/sync-before-example.html',
			before(page, element) {
				console.log('Just some simple synchronous code.');
			},
			after(page, element) {
				console.log('You can put anything in here that you need to!');
			},
		},
		{
			route: 'bundles/your-bundle/graphics/async-before-example.html',
			before: async (page, element) => {
				console.log('But you can also use async code in you `before` method if you need to!');
				await page.evaluate(() => {
					console.log('This will print in the browser console! Cool!');
				});
			},
			after: async (page, element) => {
				await page.evaluate(() => {
					console.log('This also prints in the browser console!');
				});
			},
		},
	],
};
```

## <a name="filter-cases"></a> How do I run only a subset of my test cases?

The `--filter` option is what you're looking for. The value you enter will be interpreted as a RegExp.

##### Example:

```bash
npm run test-screenshots -- --filter=example
npm run update-screenshots -- --filter=example
npm run debug-screenshots -- --filter=example
```

## <a name="typescript"></a> How do I author my test definitions in TypeScript?

If you'd like to write your test defintions in Typescript, do the following:

-   `npm i -D ts-node`
-   Update your `scripts` in `package.json` to look like this:

    ```json
    {
    	"test-screenshots": "ts-node ./node_modules/nodecg-screenshot-tester/dist/bin/main --definitions test/screenshots.ts",
    	"update-screenshots": "npm run test-screenshots -- --update",
    	"debug-screenshots": "npm run test-screenshots -- --debug"
    }
    ```

-   Update your test definitions file to look like this:

    ```ts
    // nodecg/bundles/your-bundle/test/screenshots.ts
    import { ConstsInterface } from 'nodecg-screenshot-tester/dist/screenshot-consts';

    const consts: Partial<ConstsInterface> = {
    	BUNDLE_CONFIG: {},
    	TEST_CASES: [
    		{
    			route: 'bundles/your-bundle/graphics/example.html',
    		},
    	],
    };

    module.exports = consts;
    ```

## <a name="other"></a> Are there other things I can do in my test cases?

There might be! I'm not always the greatest at updating documentation. 🙇‍♂️

You can look at the `TestCase` interface in [screenshot-consts.ts](https://github.com/nodecg/nodecg-screenshot-tester/blob/master/src/screenshot-consts.ts) to see all the supported properties.
