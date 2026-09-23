---
"@dhis2-chap/modeling-app": minor
"@dhis2-chap/ui": minor
---

Add a Datasets page where data can be imported once, named per covariate, and reused across evaluations (CLIM-1075). While building a dataset, the app suggests column names from CHAP and shows how many models can use it, and which columns to add to support more, and lists the DHIS2 data items each column used in earlier datasets first in the data item picker. A data check previews which locations CHAP would leave out before anything is saved, and the locations CHAP leaves out on import are shown afterwards. New evaluations now start from a saved dataset, with importing from DHIS2 as the second option.
