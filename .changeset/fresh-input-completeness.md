---
"@dhis2-chap/modeling-app": minor
---

Datasets created on Chap Core 2.6.0+ now save their target column, and evaluations always use it. To evaluate a different target, create a new dataset.

Add a dataset details page showing how complete the target and every covariate are per period, and which locations are missing values. The same view appears after "Check data" when creating a dataset, and prediction setups show the completeness of their latest input data.
