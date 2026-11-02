---
"@dhis2-chap/modeling-app": minor
---

Datasets created on Chap Core 2.6.0+ now save their target column, and evaluations always use it. To evaluate a different target, create a new dataset.

Add a dataset details page showing how complete the target and every covariate are per period, with the locations missing a value (or all locations) in a table. The same view appears after "Check data" when creating a dataset. Dataset names link to the details page, row actions move into a menu, and the dataset pages link to their user guide. Prediction setups get a small "Latest input data" check linking to the dataset behind the latest run. Benchmarks no longer offer to add models when the dataset's saved target differs from the benchmark's, and running evaluations show under their benchmark when the target comes from the dataset. Evaluation summaries show the dataset's target column, and charts label the observed series "Actual values" instead of "Actual Cases" or "Real Cases".
