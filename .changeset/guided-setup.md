---
'@dhis2-chap/modeling-app': minor
---

Add an experimental guided setup that goes from DHIS2 data to predictions in four steps (data, evaluate, choose model, predict), with an overview of the setups that have been started and the stage each one is at. The steps say modeling package, configured model and trained model for the three things "model" can mean. Evaluating a modeling package can tune its configuration automatically where Chap Core 2.9.0 and the package support it. Choosing a model shows whether it beats the baseline and is right about its uncertainty, with its forecasts next to what happened, and sets the signal policy. Where Chap Core 2.9.0 can estimate it, the Evaluate and Choose model steps and the benchmark page say how much of the lead of the best model is expected to be luck and what to expect of it on new data. Benchmarks get their own sidebar entry and the detailed pages move under All tools [CLIM-1752].
