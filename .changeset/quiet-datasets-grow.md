---
"@dhis2-chap/modeling-app": minor
"@dhis2-chap/ui": minor
---

Add a Datasets page where data can be imported once, named per covariate, and reused across evaluations (CLIM-1075). While building a dataset, the app suggests column names from CHAP, shows how many models can use it and which columns to add to support more, and lists the DHIS2 data items each column used in earlier datasets first in the data item picker. A data check has CHAP validate the data in a dry run and previews which locations it would leave out before anything is saved (needs a CHAP Core version with `dryRun` on make-dataset), and the locations CHAP leaves out on import are shown afterwards. New evaluations can now start from a saved dataset, with importing from DHIS2 as the second option.

Datasets created by evaluations and predictions are hidden from the Datasets page and the saved-dataset evaluation form, with an Origin filter that can be cleared to show them. This needs a CHAP Core version that flags datasets created manually; older versions keep showing all datasets (CLIM-1163).
