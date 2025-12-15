# [3.1.0](https://github.com/dhis2-chap/chap-frontend/compare/v3.0.0...v3.1.0) (2025-12-09)


### Features

* add responseTimeoutSeconds handling to CHAP route [CLIM-260] ([7228f9e](https://github.com/dhis2-chap/chap-frontend/commit/7228f9eda0b40b7f023d1c28809ee8bf042c2f10))

# [3.0.0](https://github.com/dhis2-chap/chap-frontend/compare/v2.2.4...v3.0.0) (2025-11-01)


* feat!: release v3 of the modeling app (#131) ([fa5e614](https://github.com/dhis2-chap/chap-frontend/commit/fa5e614e5d2f81359a223c0711d46b3cfa701ecf)), closes [#131](https://github.com/dhis2-chap/chap-frontend/issues/131)


### Bug Fixes

* control table params via URL [skip release] ([709de23](https://github.com/dhis2-chap/chap-frontend/commit/709de23d116fd8aa69b107919ae1cf2503deab32))
* ensure models search input is always controlled [skip release] ([4295a56](https://github.com/dhis2-chap/chap-frontend/commit/4295a5609a464adddc1cc1c3d84e2c8618ab9ece))


### Features

* add 'Include archived' checkbox to models table [skip release] ([ce630a1](https://github.com/dhis2-chap/chap-frontend/commit/ce630a190177a09d4e99341ad667d353d74dc9b0))
* add archive model functionality [skip release] ([08956f5](https://github.com/dhis2-chap/chap-frontend/commit/08956f5dfaa21fd8124a9146c4045e226f5ec68e))
* add backtest plot widget to evaluation details page [skip release] ([f431791](https://github.com/dhis2-chap/chap-frontend/commit/f431791a8bbe8331eb82e79742e2dba422973595))
* add configured model creation flow [skip release] ([1bd6470](https://github.com/dhis2-chap/chap-frontend/commit/1bd6470fafeaef1251d45a4a9b97fd7d94ea8197))
* add create new evaluation based on existing [skip release] ([d6f8bc7](https://github.com/dhis2-chap/chap-frontend/commit/d6f8bc7943c1c50fc818710ce16a8fc28ce88b95))
* add custom metric plots [skip release] ([2777761](https://github.com/dhis2-chap/chap-frontend/commit/2777761e0774e6205e0175ef066450323577375f))
* add evaluation summary widget [skip release] ([2278cd3](https://github.com/dhis2-chap/chap-frontend/commit/2278cd3dcb36f1b6f2fb28fe9353a8953aaaf65d))
* add evaluations dashboard with metric plot [skip release] ([123167a](https://github.com/dhis2-chap/chap-frontend/commit/123167ae05eaf7d80d754aded86e305c987b2862))
* add ModelExecutionResultWidget to evaluation details page [skip release] ([4c11291](https://github.com/dhis2-chap/chap-frontend/commit/4c11291626d73b972492f4f00225690a85a5d7a1))
* add models page [skip release] ([80222ef](https://github.com/dhis2-chap/chap-frontend/commit/80222efb7313365fe9659b92053c01a772dfa3af))
* add Predict button to evaluation quick actions [skip release] ([8360788](https://github.com/dhis2-chap/chap-frontend/commit/83607885bccb376ccea3e5cf00975defc16938a5))
* add predictions pages [skip release] ([f40a70b](https://github.com/dhis2-chap/chap-frontend/commit/f40a70ba1cf51c2a731fb9f254c77d31b59655da))
* add PredictionSummaryWidget component [skip release] ([88480ae](https://github.com/dhis2-chap/chap-frontend/commit/88480ae24ca0439ed7bccc90749760bd65c0b8cc))
* add quick actions widget to predictions page [skip release] ([f5f26db](https://github.com/dhis2-chap/chap-frontend/commit/f5f26db9ca6ebbf4c5bb531072aa7ca640fec236))
* add QuickActionsWidget to EvaluationDetails page [skip release] ([7de76d1](https://github.com/dhis2-chap/chap-frontend/commit/7de76d1eef136efa6698ef5d78ced6f9124ddd34))
* create new import page for predictions [skip release] ([1b49846](https://github.com/dhis2-chap/chap-frontend/commit/1b49846a7f3044d00f889d0fe9d60d2ecb866497))
* extract jobs content into separate folder [skip release] ([843f869](https://github.com/dhis2-chap/chap-frontend/commit/843f869dcc6ad951ceef99b839a762ddf9e66a97))
* move backtest filtering to URL parameters [skip release] ([8396ead](https://github.com/dhis2-chap/chap-frontend/commit/8396ead36143259cbb02cc1b29dd465747d7d585))
* persist warning dismissal state using localStorage [skip release] ([4e9192f](https://github.com/dhis2-chap/chap-frontend/commit/4e9192fb9e8409782afd34111850bdd335a2e9fc))
* replace CRPS column with locations in evaluations table [skip release] ([4764a1b](https://github.com/dhis2-chap/chap-frontend/commit/4764a1b4b109a8d24282099a704d186a17d8f6eb))


### BREAKING CHANGES

* The modeling app will now require CHAP v1.1.0 or higher to work.

## [2.2.4](https://github.com/dhis2-chap/chap-frontend/compare/v2.2.3...v2.2.4) (2025-08-29)


### Bug Fixes

* add data mapping to form state ([#89](https://github.com/dhis2-chap/chap-frontend/issues/89)) ([ddc03bc](https://github.com/dhis2-chap/chap-frontend/commit/ddc03bcd99235cf822685cf8be066679adfdc25c)), closes [#78](https://github.com/dhis2-chap/chap-frontend/issues/78)
* add turborepo [skip release] ([25fdcce](https://github.com/dhis2-chap/chap-frontend/commit/25fdcce5a5721dd6c645328804380049cd80e960))


### Features

* add viteConfigExtensions to d2.config.js files [skip release] ([952c243](https://github.com/dhis2-chap/chap-frontend/commit/952c24399c1e8cfb2e9197cd7836b73ed8b9d469))

## [2.2.3](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v2.2.2...v2.2.3) (2025-08-20)


### Bug Fixes

* add prevent default on covariate addings [skip release] ([3a9e48d](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/3a9e48d175b4390ee7ddb9c4abfb10d9bb7a9e21))
* enable export of charts [skip release] ([#83](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/83)) ([6c632e6](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/6c632e6437b84e8f1edf932ca41d2715f4d86461))
* sync comparison charts only, sync y axis ([#84](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/84)) ([5e1887d](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/5e1887d35d8491f80885f45db3a8fabf42204766))
* sync url with global shell [skip release] ([#80](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/80)) ([fcf83b3](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/fcf83b35f15f612dee07ad92acb67b4f285f2efb))

## [2.2.2](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v2.2.1...v2.2.2) (2025-06-04)


### Bug Fixes

* add get started page with collapsed sidebar [skip release] ([a5a5c3e](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/a5a5c3e90e98c4a669fd85338db38c0feb01c7c9))
* add request queue to chap endpoints after errors [skip release] ([#76](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/76)) ([a452392](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/a452392575cbac3f6293713d235a35f979b78ff0))
* add validation and dry run to new evaluation form ([da16655](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/da16655e025b3203f0f478c964b3fc28d9c4d986))
* chart-label properly ([#79](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/79)) [skip release] ([c80ab3b](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/c80ab3ba29db155ea8b8fd8308f8a6d843299bec))
* **chart:** change chart-label to evaluation [skip release] ([#71](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/71)) ([930a3f9](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/930a3f9587075643a006a75dcfc3325f005fc674))
* **compare:** optimize chart cache and rendering [skip release] ([#73](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/73)) ([7ec4291](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/7ec4291739cc422094ba9fc7ecf1b53cb5982327))
* **sidebar:** collapse sidebar in new evaluation [skip release] ([#72](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/72)) ([1e7cc9f](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/1e7cc9fc477e229a873ce3f63169aac33ae09409))

## [2.2.1](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v2.2.0...v2.2.1) (2025-06-02)


### Bug Fixes

* use ISO week for year calculation ([#74](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/74)) ([7fd2f9c](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/7fd2f9ca433415a67a8033e3ab77e6e30655cf07))

# [2.2.0](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v2.1.1...v2.2.0) (2025-06-01)


### Features

* improve model selection UI ([#66](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/66)) ([1e7a69c](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/1e7a69c7877a63101c8363629cf4444bde2b1a11))

## [2.1.1](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v2.1.0...v2.1.1) (2025-06-01)


### Bug Fixes

* improve number validation and error handling [skip release] ([#67](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/67)) ([264d5bf](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/264d5bf27e42bc7ee575ca7964e89abae8778707))
* **chart:** use line series-type for actual cases ([#70](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/70)) ([1301b63](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/1301b63c3a29d409256a8e8a0297b746789dba7f))
* **orgunits:** sorted units and clear all button [skip release] ([#69](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/69)) ([8cbfd62](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/8cbfd624ff36945e3f7c11e25143b3789d03abfe))


### Features

* add status indicator to evaluation table [skip release] ([#61](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/61)) ([6485f84](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/6485f846b02f25826208eeda4aa3936870936063))

# [2.1.0](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v2.0.0...v2.1.0) (2025-06-01)


### Bug Fixes

* fallback to ids when fetching orgunit data [skip release] ([#65](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/65)) ([4553431](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/4553431b6413f8352bc64b83e8be87256f3e0550))
* **plot-data:** find plotdata in cache as initialdata [skip release] ([#64](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/64)) ([b4de849](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/b4de8493404282243875e8fbb5385284d01268fc))


### Features

* add CRPS to BacktestsTable [skip release] ([#62](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/62)) ([eb705f6](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/eb705f6c6ecfb162de41ad54fe884fa568b20bcf))
* add link to evaluation comparison in BacktestsTable ([#63](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/63)) ([4c371ac](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/4c371ac2ccf715466799a0866e7fb8b0cf4a1d1a))

# [2.0.0](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v1.3.0...v2.0.0) (2025-05-31)


* feat!: release v3 of the modeling app ([bf77817](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/bf7781788aa96e33d9032d71b3a13ad7818921cf))
* feat!: release v3 (#60) ([3eaa5c9](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/3eaa5c9377b0ad87efd904c8f61990224872edd1)), closes [#60](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/60)


### Bug Fixes

* **evaluation:** use correct actual cases ([#53](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/53)) ([37de7d9](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/37de7d9889036ee896de2398eb02993c6a1571ec))
* add loading spinner for plotdata ([0ef86dd](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/0ef86dd7f20e25114831dd0035fed1ef383103e4))
* validate Chap connection on initial load [skip release] ([0315fda](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/0315fda1f23bd53e06aea4fd0a095c5c8426e4e8))


### Features

* **version:** clientside backend compat check ([#51](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/51)) ([6096789](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/609678950e931a4e4b94a68688d0e8c809ff66d8))
* add eslint [skip release] ([#38](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/38)) ([76cefb3](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/76cefb366a65b435e2d889df7fbe5362d2ef7e51))
* add functionality for revoking jobs ([#49](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/49)) ([1c9e225](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/1c9e2255b496e28167f3cf0b404ffeb775ecede2))
* add jobs table with filtering and actions ([#48](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/48)) ([8e84824](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/8e8482486e58fa178607de39834505ef53a50c75))
* add new evaluations page and table ([#40](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/40)) ([8ed9cf5](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/8ed9cf5cf32e05bd00369432707dcc045d9ac91f))
* add sidebar and layout refactor ([#39](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/39)) ([2304209](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/2304209217c3071b8e5c91c1906d17f603ef045e))
* configure model template page ([#56](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/56)) ([f06a700](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/f06a7008dd06b1ac41ff648632447eb678fad5cc)), closes [#55](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/55)
* create new evaluation page ([c5681ec](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/c5681ec5f898eb5570509e100eea685fb52ebdeb))
* **compare:** compare evaluations page ([#50](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/50)) ([08cd9bc](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/08cd9bc352ed5443b4c5528c638ec7c5b9b0ab4f))
* separate route actions button [skip release] ([08bf587](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/08bf5870a711845ebaba89beb240d8dca961dd12))


### BREAKING CHANGES

* this version is only compatible with chap-core >=1.0.9
* modeling app supports chap-core v1.0.9 and higher

# [1.3.0](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v1.2.1...v1.3.0) (2025-05-10)


### Features

* add new main page and settings ([601d741](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/601d7414ff9dfd6aa0f9e8ba9a09ec72184dfd49))

## [1.2.1](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v1.2.0...v1.2.1) (2025-04-30)


### Bug Fixes

* evaluations not showing when clicking view ([8d31a85](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/8d31a85a7d3a321dc963d8d6b3948743a7865c3e))

# [1.2.0](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v1.1.0...v1.2.0) (2025-04-29)


### Bug Fixes

* check if public from system-info ([#27](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/27)) ([0882ea0](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/0882ea05c3429aa8a2ca5a932b272cef48d80d86))
* correct url on put chap-url ([064bfc9](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/064bfc9e6595df53042761e0a05856c4115500de))
* typescript CI & Release pipeline [skip release] ([c1356b2](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/c1356b27c5338402197f7731a548d599eeefcbb8))
* warn if bad request ([951db9f](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/951db9f52b96b675284468df88c9ae5a12c7e9bd))


### Features

* fix release note less than 100 char ([#22](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/22)) ([173fd54](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/173fd54666bbbb971723c18d2e3999b6677710a1))
* release new version ([b89c2b6](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/b89c2b64fd8cca4a9dd7991b7170c8b23f509cc3))

# [1.1.0](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v1.0.3...v1.1.0) (2025-04-08)


### Bug Fixes

* error message for indicator no response and find dataItem id on show prediction ([6c3449a](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/6c3449aa77d07561747f3c7a44855c5dfdc0177e))


### Features

* add new evaluations and show evaluation results ([#17](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/17)) ([03c289c](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/03c289ce7613e421fd3915b178a5f5eedc5ae395))

## [1.0.3](https://github.com/dhis2-chap/chap-frontend-monorepo/compare/v1.0.2...v1.0.3) (2025-02-17)


### Bug Fixes

* trigger release ([f2319d8](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/f2319d8d80d0d3be8e6011d2e2c3732a9262d576))
* upgrade app-platform libraries + set up platform workflows ([#6](https://github.com/dhis2-chap/chap-frontend-monorepo/issues/6)) ([76cc158](https://github.com/dhis2-chap/chap-frontend-monorepo/commit/76cc158af65b454aac3a182d1ad3042fa6db646a))
