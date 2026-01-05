# Getting Started Guide - Draft Content

## Evaluate First, Predict Second

Always evaluate a model before using it for predictions. Evaluations run the model against historical data and compare its predictions to what actually happened. This shows you how well the model captures patterns in your specific context. A model that performs well in one country or region may not work as well with your data — evaluation tells you before you commit to using it for real forecasting.

## Understanding Models

Models are pre-built algorithms designed to predict disease outcomes based on input data. Each model has an **assessment status** indicating how thoroughly it has been tested — "Production" means it's well-validated and reliable, while "Experimental" means it's still being developed. Models also require specific inputs called **covariates**, such as temperature, rainfall, or population data. Before selecting a model, check that you have the data it needs available in your DHIS2 instance.

## Data Mapping

To run a model, you need to connect its data requirements to your DHIS2 data items. The **target variable** is the outcome you want to predict, such as confirmed malaria cases or dengue incidence. **Covariates** are the factors the model uses to inform its predictions — these might include climate variables, demographic data, or other health indicators. Accurate mapping is essential: the model assumes your data items represent what it expects, so mismatches will produce unreliable results.

## What Makes Good Predictions

Prediction quality depends heavily on data quality. Models need complete data across all selected time periods and geographic locations — missing values for certain weeks or districts will affect accuracy. Having sufficient historical depth also matters, as models learn seasonal patterns and trends from past data. Finally, consistent reporting practices are important — if data collection methods or definitions changed over time, the model may struggle to produce reliable forecasts.

## What to Learn Next

- How to create and compare model evaluations
- How to create predictions and import results to DHIS2
- How to configure data mappings for different models
