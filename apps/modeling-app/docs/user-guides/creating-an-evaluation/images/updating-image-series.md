# Updating Screenshot Series for Guides

This document describes how to reproduce the screenshots used in the "Creating an Evaluation" guide. Follow these steps exactly to ensure consistency across updates.

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

## Screenshot Series: Creating an Evaluation

All images are stored in: `apps/modeling-app/src/content/guides/images/`

---

### Step 1: Navigate to Evaluations Page
**File:** `eval-step-1-navigate.png`

1. Log in to the application
2. Navigate to the **Evaluate** section from the sidebar (should be the default landing page)
3. Ensure the evaluations table is visible with the **"New evaluation"** button in the top right
4. Take a full-page screenshot showing:
   - The sidebar with "Evaluate" selected
   - The "Evaluations" heading and description
   - The search/filter bar
   - The evaluations table (with any existing evaluations)
   - The "New evaluation" button clearly visible

---

### Step 2: Enter Evaluation Name
**File:** `eval-step-2-name.png`

1. Click the **"New evaluation"** button
2. In the Name field, enter: **`EWARS Evaluation 20-24`**
3. Take a screenshot showing the form with:
   - The "New evaluation" heading
   - The Name field filled in
   - The Period type, From/To period fields visible below
   - The Organisation units and Model sections visible

---

### Step 3: Configure Time Period
**File:** `eval-step-3-period.png`

1. Set the following values:
   - **Period type:** Monthly (keep the dropdown closed for the screenshot)
   - **From period:** `2020-01` (displays as "januar 2020")
   - **To period:** `2024-12` (displays as "desember 2024")
2. Take a screenshot showing:
   - The Period type dropdown showing "Monthly"
   - Both date fields filled with the date range
   - The Organisation units section visible below

**Note:** The date format in the input is `YYYY-MM` but displays in the local language format.

---

### Step 4: Select Organisation Units
**File:** `eval-step-4-orgunits.png`

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
**File:** `eval-step-5-model.png`

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
**File:** `eval-step-6-mapping.png`

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
   - Population: `LSB: Population (estimated-single age)`
   - Rainfall: `CCH: Precipitation (CHIRPS)`
   - Mean temperature: `CCH: Air temperature (ERA5-Land)`
6. Take the screenshot showing the modal with all mapping fields visible
7. Click **"Save"** to close the modal

---

### Step 7: Review and Submit
**File:** `eval-step-7-submit.png`

1. After closing the data mapping modal, scroll to ensure the form summary is visible
2. Take a screenshot showing:
   - The filled form fields (Period type, From/To period)
   - Organisation units showing "Selected: 18 org units"
   - Model showing "CHAP-EWARS Model"
   - Dataset Configuration showing "4/4 data items mapped"
   - The **"Start dry run"** and **"Start import"** buttons at the bottom

---

## Tips for Consistent Screenshots

1. **Browser size:** Always use 1728×1117 pixels for consistency
2. **Clean state:** Start from a fresh browser session to avoid cached data affecting the UI
3. **Language:** The application uses the browser's locale for date formatting - screenshots show Norwegian locale (januar, desember)
4. **Timing:** Wait for any loading spinners to complete before taking screenshots
5. **Modals:** For modal screenshots, ensure the modal is fully rendered and any animations have completed
6. **React Query Devtools:** Comment out the ReactQueryDevtools in the `apps/modeling-app/src/components/App.tsx` file. This is important so that the icon does not appear in the screenshots. Uncomment it when you are done taking the screenshots.

---

## Data Summary

| Field | Value |
|-------|-------|
| Evaluation Name | EWARS Evaluation 20-24 |
| Period Type | Monthly |
| From Period | 2020-01 (januar 2020) |
| To Period | 2024-12 (desember 2024) |
| Organisation Units | All 18 Lao PDR provinces |
| Model | CHAP-EWARS Model |
| Data Mapping | 4/4 data items mapped |
