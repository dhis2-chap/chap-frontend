---
'@dhis2-chap/modeling-app': patch
'@dhis2-chap/core': patch
---

Remove a delay on pages that count the periods of a dataset, such as the dataset import form and the evaluation forms. Counting a few years of monthly or weekly data took up to half a second on every render and now takes a few milliseconds once.
