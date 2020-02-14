# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="8.0.1"></a>
## [8.0.1](https://github.com/nodecg/nodecg-screenshot-tester/compare/v8.0.0...v8.0.1) (2020-02-14)


### Bug Fixes

* don't throw on non-TTY stdout ([#8](https://github.com/nodecg/nodecg-screenshot-tester/issues/8)) ([ab02a5e](https://github.com/nodecg/nodecg-screenshot-tester/commit/ab02a5e))



<a name="8.0.0"></a>
# [8.0.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v7.0.0...v8.0.0) (2020-02-14)


### Code Refactoring

* remove all GSAP-specific code ([f00e67a](https://github.com/nodecg/nodecg-screenshot-tester/commit/f00e67a))


### Features

* enable full concurrency; remove ava dependency ([#7](https://github.com/nodecg/nodecg-screenshot-tester/issues/7)) ([633e98a](https://github.com/nodecg/nodecg-screenshot-tester/commit/633e98a))


### BREAKING CHANGES

* The dependency on ava has been removed, and `nodecg-screenshot-tester` is now a standalone tool. Please consult the README for updated usage instructions.
* All code specific to GSAP has been removed, in an effort to further generalize this tool.

What this means in practice is that if you are still running GSAP 2, then nodecg-screenshot-tester will no longer automatically detect when a Timeline or Tween is returned by your entranceMethod, and it will not wait for it to complete before taking the screenshot.

However, nodecg-screenshot-tester does still detect when entranceMethod returns a Promise, and waits for that. GSAP 3 now has a .then method on all animations, so if you upgrade your codebase to GSAP 3 then you will get this functionality back. Else, you may need to wrap your GSAP 2 timelines in promises in your own codebase.



<a name="7.0.0"></a>
# [7.0.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v6.0.0...v7.0.0) (2020-02-13)


### Bug Fixes

* ensure loads are done before taking screenshot ([90ea8fc](https://github.com/nodecg/nodecg-screenshot-tester/commit/90ea8fc))


### Chores

* migrate to eslint, add prettier ([92a2b43](https://github.com/nodecg/nodecg-screenshot-tester/commit/92a2b43))


### Features

* add optional "after" callback ([e7e5432](https://github.com/nodecg/nodecg-screenshot-tester/commit/e7e5432))
* allow generate-fixture-screenshots to run in parallel ([1c86118](https://github.com/nodecg/nodecg-screenshot-tester/commit/1c86118))
* augment window type ([4df22b6](https://github.com/nodecg/nodecg-screenshot-tester/commit/4df22b6))


### BREAKING CHANGES

* By default, generate-fixture-screenshots now runs in parallel. The concurrency is automatically computed based on the number of physical CPU cores detected. This might expose flakiness in screenshots that previously seemed reliable when running under a less-strained system.

If you need to stick to running tests one-at-a-time, pass in the --concurrency=1 flag.
* some code has changed in subtle ways that could alter the behavior of the program. It _shouldn't_, but it _could_.



<a name="6.0.0"></a>
# [6.0.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v5.1.0...v6.0.0) (2020-01-28)


### Bug Fixes

* **package:** mock-nodecg is a prodDep ([9518e3c](https://github.com/nodecg/nodecg-screenshot-tester/commit/9518e3c))


### BREAKING CHANGES

* **package:** the last release should have been a breaking change, because it updates mock-nodecg in a way which substantially changes its behavior. Refer to the mock-nodecg changelog for details.



<a name="5.1.0"></a>
# [5.1.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v5.0.2...v5.1.0) (2020-01-28)


### Features

* **package:** update mock-nodecg ([d8e2667](https://github.com/nodecg/nodecg-screenshot-tester/commit/d8e2667))



<a name="5.0.2"></a>
## [5.0.2](https://github.com/nodecg/nodecg-screenshot-tester/compare/v5.0.1...v5.0.2) (2019-05-14)


### Bug Fixes

* i guess we forgot how to read images off disk since 90 minutes ago??? ([d0d9df0](https://github.com/nodecg/nodecg-screenshot-tester/commit/d0d9df0))



<a name="5.0.1"></a>
## [5.0.1](https://github.com/nodecg/nodecg-screenshot-tester/compare/v5.0.0...v5.0.1) (2019-05-14)


### Bug Fixes

* wait for both load and networkidle0 ([fb503e5](https://github.com/nodecg/nodecg-screenshot-tester/commit/fb503e5))



<a name="5.0.0"></a>
# [5.0.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v4.1.0...v5.0.0) (2019-05-14)


### Features

* wait until all network connections have completed before taking screenshots ([8735dde](https://github.com/nodecg/nodecg-screenshot-tester/commit/8735dde))


### BREAKING CHANGES

* nodecg-screenshot-tester now waits for 500ms of network idle time before taking a screenshot. This is done to try to ensure that all fonts, image, etc, have loaded on the page before the screenshot is taken.



<a name="4.1.0"></a>
# [4.1.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v4.0.0...v4.1.0) (2019-05-10)


### Features

* add support for optional "metadata" object ([1e9da96](https://github.com/nodecg/nodecg-screenshot-tester/commit/1e9da96))



<a name="4.0.0"></a>
# [4.0.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v3.0.0...v4.0.0) (2019-04-30)


### Bug Fixes

* **package:** update puppeteer ([5a973d8](https://github.com/nodecg/nodecg-screenshot-tester/commit/5a973d8))


### BREAKING CHANGES

* **package:** Puppeteer has been updated, which means a new Chromium version is being used. This will likely change how certain pages render, and will change some screenshots as a result. You may need to generate new fixtures.



<a name="3.0.0"></a>
# [3.0.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v2.2.2...v3.0.0) (2019-03-12)


### Features

* call `before` after populating replicants ([1887e14](https://github.com/nodecg/nodecg-screenshot-tester/commit/1887e14))


### BREAKING CHANGES

* `before` is now called after replicant prefills have been populated.



<a name="2.2.2"></a>
## [2.2.2](https://github.com/nodecg/nodecg-screenshot-tester/compare/v2.2.1...v2.2.2) (2019-02-16)


### Bug Fixes

* **replicants:** fix string prefill values being unusable ([3f88e35](https://github.com/nodecg/nodecg-screenshot-tester/commit/3f88e35))



<a name="2.2.1"></a>
## [2.2.1](https://github.com/nodecg/nodecg-screenshot-tester/compare/v2.2.0...v2.2.1) (2019-01-28)


### Bug Fixes

* **package:** expose typings ([9e3b4f8](https://github.com/nodecg/nodecg-screenshot-tester/commit/9e3b4f8))



<a name="2.2.0"></a>
# [2.2.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v2.1.2...v2.2.0) (2018-11-18)


### Features

* transform bare module specifiers ([#1](https://github.com/nodecg/nodecg-screenshot-tester/issues/1)) ([6b03314](https://github.com/nodecg/nodecg-screenshot-tester/commit/6b03314))



<a name="2.1.2"></a>
## [2.1.2](https://github.com/nodecg/nodecg-screenshot-tester/compare/v2.1.1...v2.1.2) (2018-10-14)


### Bug Fixes

* **package:** update mock-nodecg dep to 1.7.0 ([e24bb4e](https://github.com/nodecg/nodecg-screenshot-tester/commit/e24bb4e))



<a name="2.1.1"></a>
## [2.1.1](https://github.com/nodecg/nodecg-screenshot-tester/compare/v2.1.0...v2.1.1) (2018-09-09)


### Bug Fixes

* strip querystring from filenames ([a8925f5](https://github.com/nodecg/nodecg-screenshot-tester/commit/a8925f5))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v2.0.0...v2.1.0) (2018-07-07)


### Bug Fixes

* fix screenshots failing when their entrance method returns a promise ([7d0fd2c](https://github.com/nodecg/nodecg-screenshot-tester/commit/7d0fd2c))


### Features

* **cli:** add support for --filter argument ([b054039](https://github.com/nodecg/nodecg-screenshot-tester/commit/b054039))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v1.0.0...v2.0.0) (2018-07-06)


### Bug Fixes

* don't provide a default entranceMethodName ([5ac21d7](https://github.com/nodecg/nodecg-screenshot-tester/commit/5ac21d7))


### Features

* add support for custom express routes via CUSTOM_ROUTES const ([05d11aa](https://github.com/nodecg/nodecg-screenshot-tester/commit/05d11aa))


### BREAKING CHANGES

* `entranceMethodName` no longer has a default value. Previously, it had a default of `enter`.



<a name="1.0.0"></a>
# [1.0.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v0.1.1...v1.0.0) (2018-06-13)


### Code Refactoring

* remove unused application-specific code ([1d692ee](https://github.com/nodecg/nodecg-screenshot-tester/commit/1d692ee))


### Features

* add support for test/fixtures/static folder ([049aa94](https://github.com/nodecg/nodecg-screenshot-tester/commit/049aa94))


### BREAKING CHANGES

* Codename IF-specific routes have been removed, and should be added directly to IF.



<a name="0.1.1"></a>
## [0.1.1](https://github.com/nodecg/nodecg-screenshot-tester/compare/v0.1.0...v0.1.1) (2018-05-28)


### Bug Fixes

* ensure that __SCREENSHOT_TESTING__ flag is set before any page scripts run ([a1e4ddb](https://github.com/nodecg/nodecg-screenshot-tester/commit/a1e4ddb))



<a name="0.1.0"></a>
# [0.1.0](https://github.com/nodecg/nodecg-screenshot-tester/compare/v0.0.1...v0.1.0) (2018-05-20)


### Features

* set viewport to declared size of graphic from the bundle's package.json ([e69a45d](https://github.com/nodecg/nodecg-screenshot-tester/commit/e69a45d))



<a name="0.0.1"></a>
## 0.0.1 (2018-05-17)
