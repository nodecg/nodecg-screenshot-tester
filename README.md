# nodecg-screenshot-tester [![npm version](https://img.shields.io/npm/v/nodecg-screenshot-tester.svg)](https://npm.im/nodecg-screenshot-tester) [![license](https://img.shields.io/npm/l/nodecg-screenshot-tester.svg)](https://npm.im/nodecg-screenshot-tester) [![Build Status](https://travis-ci.com/nodecg/nodecg-screenshot-tester.svg?branch=master)](https://travis-ci.com/nodecg/nodecg-screenshot-tester)

> Automated visual regression testing of NodeCG graphics.

## Motivation
It's difficult to write tests for NodeCG graphics, or really any broadcast graphics in general. With `nodecg-screenshot-tester`, screenshot tests can often be made very quickly, and for a wide variety of cases for each of your bundle's graphics.

Screenshot tests aren't a complete solution, but they're pretty useful and are better than nothing. Ideally, you'd use them alongside traditional unit and integration tests.

## Can you show me an example?
Yes, [`sgdq18-layouts`](https://github.com/GamesDoneQuick/sgdq18-layouts/tree/master/test) makes full use of `nodecg-screenshot-tester`. These links may help explain what `nodecg-screenshot-tester` is, and how it works:

- [`sgdq18-layouts`'s `package.json`](https://github.com/GamesDoneQuick/sgdq18-layouts/blob/master/package.json)
- [`sgdq18-layouts`'s tests](https://github.com/GamesDoneQuick/sgdq18-layouts/tree/master/test)
- [`sgdq18-layouts`'s reference screenshots](https://github.com/GamesDoneQuick/sgdq18-layouts/tree/master/test/fixtures/screenshots), used to validate the tests

## Table of Contents
* [How do I use it in my bundle?](#bundle-usage)
* [How do I test my animations?](#animation-testing)
* [Can I delay the screenshot?](#delay)
* [How do I populate Replicants for testing?](#populating-replicants)
* [What if my graphic relies on HTTP routes not provided by `nodecg-screenshot-tester`?](#custom-routes)
* [Can I run arbitrary code as part of my test?](#arbitrary-code)
* [Are there other things I can do in my test cases?](#other)

## <a name="bundle-usage"></a> How do I use it in my bundle?
To be completely blunt, the API for this is quirky and probably could be improved. But, it does work and has been successfully used for major broadcasts.

`nodecg-screenshot-tester` is hardcoded to use the [ava](https://github.com/avajs/ava) test runner. If you use another test runner such as [Mocha](https://mochajs.org/), you are out of luck.

1. Add `nodecg-screenshot-tester` and `ava` as devDependencies in your bundle:

	```bash
	npm i -D nodecg-screenshot-tester ava
	```
2. Add these scripts to the `scripts` stanza in your bundle's `package.json` :

	```json
	{
		"scripts": {
			"test": "ava test",
			"generate-fixture-screenshots": "generate-fixture-screenshots",
			"debug-fixture-screenshots": "generate-fixture-screenshots --debug"
		}
	}
	```

	If you want to run a linter or other static analysis, the `pretest` script is a good place to do so. `npm` will automatically run it before executing your `test` script.
3. Create a dummy test which passes an `ava` instance to `nodecg-screenshot-tester`:

	```js
	// nodecg/bundles/your-bundle/test/screenshot-comparison.js
    const test = require('ava');
    const {comparisonTests} = require('nodecg-screenshot-tester');
    comparisonTests(test);
	```
4. Create a `screenshot-consts.js` file, which is where your test cases will be defined:

	```js
	// nodecg/bundles/your-bundle/test/helpers/screenshot-costs.js
	module.exports = {
		TEST_CASES: [{
			route: 'bundles/your-bundle/graphics/example.html'
		}]
	}
	```
	
	This is the most simple possible example. All it will do is load `example.html` and take a screenshot of it. It won't try to run any of your animations or set values in any of your replicants. Those things require extra configuration, which we will cover later.
5. Generate the "fixture" screenshots. These are the references used to determine if a test passes or fails:

	```bash
	npm run generate-fixture-screenshots
	```

	If you're having troubles with this step, you can run `npm run debug-fixture-screenshots`, which will disable headless mode in Puppeteer, allowing you to see and interact with the Chromium instance being used to take the screenshots.
	
	> ❗ Note that your graphics may render differently when using `debug-fixture-screenshots`. Only use this command for debugging, and always use the normal `generate-fixture-screenshots` to create your final, completed fixtures. Do not commit screenshots generated by `debug-fixture-screenshots`.
6. Review your fixture screenshots, to ensure that they show what you want and don't have any issues.

	> ❗ This library doesn't know if your screenshots are good or not. All it knows is if the screenshots it takes during `npm test` match the screesnhots in your `test/fixtures/screenshots` folder. It is up to you to ensure that your fixtures are actually correct.
7. Run the actual tests:

	```bash
	npm test
	```
8. With any luck, you will now have one passing screenshot test! 🙌

## <a name="animation-testing"></a> How do I test my animations?
You can provide a `selector`, `entranceMethodName` and optional `entranceMethodArgs` in your test cases. `nodecg-screenshot-tester` will find `selector` on your page and invoke that method on it with the provided args. This works with graphics made with a component framework, such as [React](https://reactjs.org/), [Polymer](https://www.polymer-project.org/), [Vue.js](https://vuejs.org/), etc.

If your element's entrance method returns a Promise, `nodecg-screenshot-tester` will wait for that Promise to resolve before taking the screesnhot.

Likewise, if your element's entrance method returns a [GreenSock](https://greensock.com/gsap) tween or timeline, `nodecg-screenshot-tester` will wait for that animation to complete before taking the screenshot.

##### Example: 
```js
// nodecg/bundles/your-bundle/test/helpers/screenshot-costs.js
module.exports = {
	TEST_CASES: [{
		route: 'bundles/your-bundle/graphics/example.html',
		selector: 'my-root-element',
		entranceMethodName: 'enter',
		entranceMethodArgs: ['foo', 123, {bar: 'baz'}]
	}]
}
```

## <a name="delay"></a> Can I delay the screenshot?
Yes! Just add an `additionalDelay` key to your test case.

It might feel like this is a hack, but you'll probably find yourself needing to add at least a few hundred milliseconds of additional delay to _most_ of your tests. Graphics are hard.

##### Example:
```js
// nodecg/bundles/your-bundle/test/helpers/screenshot-costs.js
module.exports = {
	TEST_CASES: [{
		route: 'bundles/your-bundle/graphics/example.html',
		additionalDelay: 1000 // Delays for 1000 milliseconds after the page has finished loading.
	}, {
		route: 'bundles/your-bundle/graphics/example2.html',
		entranceMethodName: 'enter',
		additionalDelay: 1000 // Delays for 1000 milliseconds after entranceMethod has resolved.
	}]
}
```

## <a name="populating-replicants"></a> How do I populate Replicants for testing?
Absolutely. If your test case specifies a `replicantPrefills` object, it will populate those Replicants with the specified values before running your entrance method (if defined) and taking the screenshot.

You can even put your Replicant values in a file on disk and have `nodecg-screenshot-tester` load them for you.

##### Example:
```js
// nodecg/bundles/your-bundle/test/helpers/screenshot-costs.js
module.exports = {
	TEST_CASES: [{
		route: 'bundles/your-bundle/graphics/example.html',
		replicantPrefills: {
			exampleReplicant: 'The "exampleReplicant" replicant will be given a string value',
			arrayExample: ['this', 'one', 'will', 'have', 'an', 'array', 'value'],
			objectExample: {objects: 'are', okay: 'too!'},
			
			fixtureExample: undefined // <- "undefined" is a special value!
			// This special value tells `nodecg-screenshot-tester` to load the value from the 	
			// nodecg/bundles/your-bundle/test/fixtures/replicants/fixtureExample.rep file on disk.
		}
	}]
}
```

## <a name="custom-routes"></a> What if my graphic relies on HTTP routes not provided by `nodecg-screenshot-tester`?
You can provide a `CUSTOM_ROUTES` key in your `screenshot-consts.js` export:

##### Example:
```js
// nodecg/bundles/your-bundle/test/helpers/screenshot-costs.js
module.exports = {
	CUSTOM_ROUTES: [{
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
		}
	}, {
		method: 'post',
		route: `/your-bundle/example-post-route`,
		handler: async (req, res) => {
			// Logic goes here.
			// Note that we made this one an async method! Anything goes. :)
		}
	}],
	TEST_CASES: [{
		route: 'bundles/your-bundle/graphics/example.html'
	}]
}
```

## <a name="arbitrary-code"></a> Can I run arbitrary code as part of my test?
Yes! You can provide a `before` method in your test case, which will be run before the screenshot is taken. It will also be run before the entrance method, if you provided a `selector` and `entranceMethodName`.

`before` methods have two arguments: `page` and `element`. Your `before` method runs in the Node.js server context, but you can easily run code in the Chromium browser context via methods such as [`page.evaluate`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageevaluatepagefunction-args).

`page` is the [Puppeteer Page](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page) instance for this particular test case. This gives you full access to the Puppeteer API to do whatever you need to do on your page to get it ready for a screenshot. Every test case is run on its own page. Things you do in one page will not affect other test cases.

`element` is an optional argument which will only be defined if your test case specified a `selector`. If your selector was found on the page, `element` will be the [Puppeteer ElementHandle](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-elementhandle) for your element.

Your `before` method can return a Promise, which also means it can be an `async` method!

##### Example:
```js
// nodecg/bundles/your-bundle/test/helpers/screenshot-costs.js
module.exports = {
		TEST_CASES: [{
			route: 'bundles/your-bundle/graphics/sync-before-example.html',
			before(page, element) {
				console.log('Just some simple synchronous code.');
				console.log('You can put anything in here that you need to!');
			}
		}, {
			route: 'bundles/your-bundle/graphics/async-before-example.html',
			before: async (page, element) => {
				console.log('But you can also use async code in you `before` method if you need to!');
				await page.evaluate(() => {
					console.log('This will print in the browser console! Cool!');
				});
			}
		}]
	}
```

## <a name="other"></a> Are there other things I can do in my test cases?
There might be! I'm not always the greatest at updating documentation. 🙇‍♂️

You can look at the `TestCase` interface in [screenshot-consts.ts](https://github.com/nodecg/nodecg-screenshot-tester/blob/master/src/screenshot-consts.ts) to see all the supported properties.
