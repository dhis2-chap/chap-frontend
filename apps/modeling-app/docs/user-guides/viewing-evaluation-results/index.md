---
title: Viewing evaluation results
description: Step-by-step guide on how to interpret the results of a completed evaluation
order: 4
category: User Guides
---

## Viewing Evaluation Results

Once an evaluation has completed, the evaluation details page shows you how well the model performed against your historical data. This page helps you determine whether the model's predictions were accurate enough to trust for forecasting.

---

### Step 1: Open the Evaluation Details Page

From the **Evaluate** page, click on the name of a completed evaluation to open its details page. You will see a back button at the top to return to the evaluations list.

![Evaluation details page overview](images/results-step-1-overview.png)

---

### Step 2: Review the Summary Widget

On the right side of the page, the **Summary** widget shows key information about the evaluation:

- **Name**: The evaluation name you entered when creating it
- **Model**: Which configured model was used
- **Period**: The time range and period type (weekly or monthly)
- **Region**: The organisation units included in the evaluation

Use this to confirm you are looking at the correct evaluation.

![Summary widget showing evaluation metadata](images/results-step-2-summary.png)

---

### Step 3: Interpret the Evaluation Result Chart

The main chart shows the model's predictions overlaid on actual data. Look for:

- **Black dots or line**: Actual observed values from your DHIS2 data
- **Coloured bands**: Prediction intervals (50% inner band and 80% outer band)
- **Median line**: The model's central prediction

A good model will have its median line close to the actual values, and the actual values should mostly fall within the prediction bands.

Use the **organisation unit menu** on the left to switch between locations and see how the model performed in different areas. Select "All locations" to see an aggregated view.

![Evaluation result chart with prediction intervals](images/results-step-3-chart.png)

---

### Step 4: Adjust the Split Period

The **split-period slider** at the bottom of the chart lets you change which point in time separates training data from prediction data. Moving the slider changes the chart to show how well the model predicted at different time points.

This helps you understand whether the model's accuracy is consistent across different time periods or if it degrades at certain points.

![Split period slider below the chart](images/results-step-4-split-period.png)

---

### Step 5: Use Quick Actions

The **Quick actions** widget provides shortcuts to common next steps:

- **Compare with...**: Opens the comparison page with this evaluation pre-selected as the base, so you can compare it against another evaluation
- **Create new based on...**: Creates a copy of this evaluation with pre-filled settings, useful for running a similar evaluation with small changes
- **Predict...**: Creates a prediction using the same model and data mapping from this evaluation

![Quick actions widget with compare, create new, and predict buttons](images/results-step-5-quick-actions.png)

---

### Step 6: Explore Metric Plots (Experimental)

If you have enabled **Metric plots** in the experimental settings, an additional widget appears showing statistical accuracy metrics (such as CRPS) for the evaluation. These metrics give a numerical measure of model performance beyond what the chart shows visually.

![Metric plots widget showing accuracy metrics](images/results-step-6-metric-plots.png)

---

### Step 7: Explore Evaluation Plots (Experimental)

If you have enabled **Evaluation plots** in the experimental settings, an additional widget appears with custom visualization types for the evaluation data. These provide alternative ways to view the model's performance.

![Evaluation plots widget with custom visualizations](images/results-step-7-evaluation-plots.png)

---

### Next Steps

After reviewing the results, you can:
- [Compare evaluations](/guides/comparing-evaluations) to see how this model stacks up against alternatives
- [Create a prediction](/guides/creating-a-prediction) if the model performs well enough for forecasting
- Run another evaluation with different settings to improve performance
