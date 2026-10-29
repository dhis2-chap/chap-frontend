---
"@dhis2-chap/modeling-app": minor
---

Add a dataset details page showing how complete the target column is per period, with the locations missing a value (or all locations) in a table. The same view appears after "Check data" when creating a dataset. New datasets save their target column (Chap Core 2.6.0+), which evaluations of the dataset then use. Dataset names link to the details page, row actions move into a menu, and the dataset pages link to their user guide. Prediction setups get a small "Latest input data" check linking to the dataset behind the latest run. Benchmarks no longer offer to add models when the dataset's saved target differs from the benchmark's, and running evaluations show under their benchmark when the target comes from the dataset.
