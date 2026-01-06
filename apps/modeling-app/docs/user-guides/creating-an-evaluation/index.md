---
title: Creating an evaluation
description: Step-by-step guide on how to create a model evaluation
order: 1
category: User Guides
---

## Creating an Evaluation

An evaluation tests how accurately a predictive model performs using your historical data. It compares actual outcomes with predicted values across specified time periods and locations, giving you confidence in the model before using it for forecasting.

---

### Step 1: Navigate to the Evaluations Page

From the main navigation, click on **Evaluate** in the sidebar to access the evaluations page. Here you can see all existing evaluations and create new ones.

Click the **New evaluation** button to start creating a new evaluation.

![Evaluations page with New evaluation button](images/eval-step-1-navigate.png)

---

### Step 2: Enter an Evaluation Name

Give your evaluation a descriptive name that helps you identify it later. For example: "Malaria Model Evaluation 2023-2024" or "Weekly Cholera Backtest".

![Name input field](images/eval-step-2-name.png)

---

### Step 3: Configure the Time Period

Select the time period settings for your evaluation:

- **Period Type**: Choose between Weekly or Monthly depending on how your data is aggregated
- **From period**: The start of your evaluation period
- **To period**: The end of your evaluation period (cannot be in the future)

The evaluation will use historical data within this range to test the model's predictions.

![Period configuration with type and date range](images/eval-step-3-period.png)

---

### Step 4: Select Organization Units

Click on the location selector to open the organization unit tree. Select one or more locations where you want to run the evaluation.

You can select individual facilities, districts, or higher-level units depending on your needs. At least one organization unit must be selected.

![Organization unit selection modal](images/eval-step-4-orgunits.png)

---

### Step 5: Select a Model

Click on the model selector to choose which predictive model to evaluate. The modal displays available models with their descriptions.

Select the model you want to test against your data. Only one model can be selected per evaluation.

![Model selection modal](images/eval-step-5-model.png)

---

### Step 6: Configure Data Mapping

After selecting a model, you need to map the model's variables to your DHIS2 data sources:

1. Click **Configure data** to open the data mapping modal
2. **Target Variable**: Map the outcome variable (e.g., disease cases) to a data element, indicator, or program indicator in DHIS2
3. **Covariates**: Map each covariate the model requires (e.g., climate data, population) to corresponding data sources

You can click **Inspect dataset** to preview the actual data that will be used before submitting.

![Data mapping configuration modal](images/eval-step-6-mapping.png)

---

### Step 7: Review and Submit

Once all fields are configured:

1. Review your selections in the form summary
2. Optionally click **Start dry run** to validate your configuration and check for missing data
3. Click **Start import** to submit the evaluation

The evaluation will be queued as a background job. You can monitor its progress on the Jobs page.

![Form summary and submit buttons](images/eval-step-7-submit.png)

---

### Next Steps

After the evaluation completes, you can:
- View detailed results and metrics on the evaluation details page
- Compare multiple evaluations to find the best model configuration
- Use a validated model to generate predictions
