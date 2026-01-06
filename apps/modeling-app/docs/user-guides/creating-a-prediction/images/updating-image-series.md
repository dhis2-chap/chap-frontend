# Updating Screenshot Series for Guides

This document describes how to reproduce the screenshots used in the "Creating a Prediction" guide. Follow these steps exactly to ensure consistency across updates.

---

## Prerequisites

- Access to a running CHAP application (typically `localhost:3000`)
  - Use the following credentials:
  - Server: `http://localhost:8080`
  - Username: `birk`
  - Password: `Solololo1!`
- If running locally on port 8080, always make sure to comment out the ReactQueryDevtools in the `apps/modeling-app/src/App.tsx` file. This is important so that the icon does not appear in the screenshots. Uncomment it when you are done taking the screenshots.
- A DHIS2 instance with the Lao PDR organisation unit hierarchy
- The CHAP-EWARS Model available in the system
- Browser window sized to **1728×1117** pixels for consistent screenshots

---

## Screenshot Series: Creating a Prediction

All images are stored in: `apps/modeling-app/docs/user-guides/creating-a-prediction/images/`

---

### Step 1: Navigate to Predictions Page
**File:** `pred-step-1-navigate.png`

1. Log in to the application
2. Navigate to the **Predict** section from the sidebar
3. Ensure the predictions table is visible with the **"New prediction"** button in the top right
4. Take a full-page screenshot showing:
   - The sidebar with "Predict" selected
   - The "Predictions" heading and description
   - The search bar
   - The predictions table (with any existing predictions)
   - The "New prediction" button clearly visible

---

### Step 2: Enter Prediction Name
**File:** `pred-step-2-name.png`

1. Click the **"New prediction"** button
2. In the Name field, enter: **`EWARS Prediction Jan-Mar 25`**
3. Take a screenshot showing the form with:
   - The "New prediction" heading
   - The Name field filled in
   - The Period type, From/To period fields visible below
   - The Organisation units and Model sections visible

---

### Step 3: Configure Time Period
**File:** `pred-step-3-period.png`

1. Set the following values:
   - **Period type:** Monthly (keep the dropdown closed for the screenshot)
   - **From period:** `2024-10` (displays as "oktober 2024")
   - **To period:** `2024-12` (displays as "desember 2024")
2. Take a screenshot showing:
   - The Period type dropdown showing "Monthly"
   - Both date fields filled with the date range
   - The Organisation units section visible below

**Note:** The date format in the input is `YYYY-MM` but displays in the local language format. For predictions, use recent periods as the training data range.

---

### Step 4: Select Organisation Units
**File:** `pred-step-4-orgunits.png`

1. Click **"Select organisation units"** to open the modal
2. In the organisation unit tree, select **all 18 provinces** under Lao PDR:
   - 01 Vientiane Capital
   - 02 Phongsali
   - 03 Louangnamtha
   - 04 Oudomxai
   - 05 Bokeo
   - 06 Louangphabang
   - 07 Houaphan
   - 08 Xainyabouli
   - 09 Xiangkhouang
   - 10 Vientiane
   - 11 Bolikhamxai
   - 12 Khammouan
   - 13 Savannakhet
   - 14 Salavan
   - 15 Xekong
   - 16 Champasak
   - 17 Attapu
   - 18 Xaisomboun

3. **Important:** Do NOT select "Lao PDR" itself - only select the province level. The system requires all org units to be at the same level.
4. The modal should show "Selected: 18 org units" at the bottom
5. Take the screenshot with the modal open showing the selected provinces
6. Click **"Confirm Selection"** to save

---

### Step 5: Select Model
**File:** `pred-step-5-model.png`

1. Click **"Select model"** to open the model selection modal
2. The modal displays available models in a card layout
3. Take the screenshot showing the modal with visible models:
   - **CHAP-EWARS Model** (Limited) - this is the one to select
   - Monthly Deep Auto Regressive (Experimental)
   - Weekly Deep Auto Regressive (Experimental)
   - Other models may be visible
4. Click **"Select Model"** on the CHAP-EWARS Model card
5. Click **"Confirm Selection"** to save

---

### Step 6: Configure Data Mapping
**File:** `pred-step-6-mapping.png`

1. Click **"Configure sources"** to open the data mapping modal
2. The modal shows fields that need to be mapped:
   - **Target section:**
     - Disease cases (dropdown to select data item)
   - **Covariates section:**
     - Population (dropdown)
     - Rainfall (dropdown)
     - Mean temperature (dropdown)
3. Choose the following data items:
   - Disease cases: `NCLE: 7. Dengue cases (any)`
   - Population: `LSB: Population (Estimated-single age)`
   - Rainfall: `CCH - Precipitation (CHIRPS)`
   - Mean temperature: `CCH - Air temperature (ERA5-Land)`
4. Take the screenshot showing the modal with all mapping fields filled
5. Click **"Save"** to close the modal

---

### Step 7: Review and Submit
**File:** `pred-step-7-submit.png`

1. After closing the data mapping modal, scroll to ensure the form summary is visible
2. Take a screenshot showing:
   - The filled form fields (Period type, From/To period)
   - Organisation units showing "Selected: 18 org units"
   - Model showing "CHAP-EWARS Model"
   - Dataset Configuration showing "All data items mapped"
   - The **"Start dry run"** and **"Start import"** buttons at the bottom

---

## Tips for Consistent Screenshots

1. **Browser size:** Always use 1728×1117 pixels for consistency
2. **Clean state:** Start from a fresh browser session to avoid cached data affecting the UI
3. **Language:** The application uses the browser's locale for date formatting - screenshots show Norwegian locale (oktober, desember)
4. **Timing:** Wait for any loading spinners to complete before taking screenshots
5. **Modals:** For modal screenshots, ensure the modal is fully rendered and any animations have completed
6. **React Query Devtools:** Comment out the ReactQueryDevtools in the `apps/modeling-app/src/App.tsx` file. This is important so that the icon does not appear in the screenshots. Uncomment it when you are done taking the screenshots.

---

## Data Summary

| Field | Value |
|-------|-------|
| Prediction Name | EWARS Prediction Jan-Mar 25 |
| Period Type | Monthly |
| From Period | 2024-10 (oktober 2024) |
| To Period | 2024-12 (desember 2024) |
| Organisation Units | All 18 Lao PDR provinces |
| Model | CHAP-EWARS Model |
| Data Mapping | 4/4 data items mapped |

---

## Differences from Evaluation Guide

The prediction guide uses the same data mappings and organisation units as the evaluation guide, but with these key differences:

1. **Route:** Navigate to `/predictions` instead of `/evaluate`
2. **Period range:** Uses more recent periods (Oct-Dec 2024) since predictions forecast future values based on recent training data
3. **Purpose:** Predictions generate forecasts for future periods, while evaluations test model accuracy on historical data
