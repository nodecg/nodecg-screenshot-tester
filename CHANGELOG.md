# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
