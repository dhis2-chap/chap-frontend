---
title: Creating a prediction
description: Step-by-step guide on how to create a model prediction
order: 2
category: User Guides
---

## What is a Prediction?

A prediction uses a trained model to forecast future disease cases based on your current data. Unlike an evaluation (which tests model accuracy on historical data), a prediction generates forecasts that can be imported into DHIS2 to support decision-making in the field.

Before creating a prediction, it's recommended to first run an [evaluation](#/guides/creating-an-evaluation) to validate that your chosen model performs well on your data.

---

### Step 1: Navigate to the Predictions Page

From the main navigation, click on **Predict** in the sidebar to access the predictions page. Here you can see all existing predictions and create new ones.

Click the **New prediction** button to start creating a new prediction.

![Predictions page with New prediction button](images/pred-step-1-navigate.png)

---

### Step 2: Enter a Prediction Name

Give your prediction a descriptive name that helps you identify it later. For example: "EWARS Prediction Jan-Mar 25" or "Dengue Forecast Q1 2025".

![Name input field](images/pred-step-2-name.png)

---

### Step 3: Configure the Time Period

Select the time period settings for your prediction:

- **Period Type**: Choose between Weekly or Monthly depending on how your data is aggregated
- **From period**: The start of your training data period
- **To period**: The end of your training data period (should be the most recent complete period)

The model will use data within this range to generate forecasts for future periods.

![Period configuration with type and date range](images/pred-step-3-period.png)

---

### Step 4: Select Organization Units

Click on **Select organisation units** to open the organization unit tree. Select one or more locations where you want to generate predictions.

You can select individual facilities, districts, or higher-level units depending on your needs. At least one organization unit must be selected, and all selected units should be at the same level.

![Organization unit selection modal](images/pred-step-4-orgunits.png)

---

### Step 5: Select a Model

Click on **Select model** to choose which predictive model to use. The modal displays available models with their descriptions and requirements.

Select the model you want to use for forecasting. Only one model can be selected per prediction.

![Model selection modal](images/pred-step-5-model.png)

---

### Step 6: Configure Data Mapping

After selecting a model, you need to map the model's variables to your DHIS2 data sources:

1. Click **Configure sources** to open the data mapping modal
2. **Target Variable**: Map the outcome variable (e.g., disease cases) to a data element, indicator, or program indicator in DHIS2
3. **Covariates**: Map each covariate the model requires (e.g., climate data, population) to corresponding data sources

You can click **Inspect dataset** to preview the actual data that will be used before submitting.

![Data mapping configuration modal](images/pred-step-6-mapping.png)

---

### Step 7: Review and Submit

Once all fields are configured:

1. Review your selections in the form summary
2. Optionally click **Start dry run** to validate your configuration and check for missing data
3. Click **Start import** to submit the prediction

The prediction will be queued as a background job. You can monitor its progress on the Jobs page.

![Form summary and submit buttons](images/pred-step-7-submit.png)

---

### Next Steps

After the prediction completes, you can:
- View forecast results and visualizations on the prediction details page
- Import the forecasted values into DHIS2 for use in dashboards and reports
- Compare predictions with actual outcomes as they become available
