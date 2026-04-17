# Updating Screenshot Series for Guides

This document describes how to reproduce the screenshots used in the "Configuring a Model" guide. Follow these steps exactly to ensure consistency across updates.

---

## Prerequisites

- Access to a running CHAP application (typically `localhost:3000`)
  - Use the following credentials:
  - Server: `http://localhost:8080`
  - Username: `birk`
  - Password: `Solololo1!`
- If running locally on port 8080, always make sure to comment out the ReactQueryDevtools in the `apps/modeling-app/src/App.tsx` file. This is important so that the icon does not appear in the screenshots. Uncomment it when you are done taking the screenshots.
- A CHAP instance with at least one model template available (e.g. `chap_ewars_monthly`)
- Browser window sized to **1728x1117** pixels for consistent screenshots

---

## Screenshot Series: Configuring a Model

All images are stored in: `apps/modeling-app/docs/user-guides/configuring-a-model/images/`

---

### Step 1: Navigate to Models Page
**File:** `configure-step-1-navigate.png`

1. Log in to the application
2. Click **Models** in the sidebar
3. Take a full-page screenshot showing:
   - The sidebar with "Models" selected
   - The Models table (empty or with existing configured models)
   - The "New model" button clearly visible in the top right

---

### Step 2: Select a Model Template
**File:** `configure-step-2-template.png`

1. Click **New model**
2. Open the **Model template** dropdown and select a non-deprecated template (e.g. `CHAP-EWARS Model`)
3. Take a screenshot showing the dropdown with the selected template and the variant name/options form just below

---

### Step 3: Enter a Variant Name
**File:** `configure-step-3-variant-name.png`

1. In the **Variant name** field, type: `default`
2. Take a screenshot showing the filled variant name and the help text rendering `<Template name> [default]`

---

### Step 4: Adjust User Options
**File:** `configure-step-4-user-options.png`

1. Leave default values for the template's user options (or tweak one to make it visible)
2. Take a screenshot focused on the user options section with the fields clearly labelled

If the selected template has no user options, pick a different template that exposes at least one option for this screenshot.

---

### Step 5: Additional Covariates (Optional)
**File:** `configure-step-5-covariates.png`

1. If the template allows free additional continuous covariates, the **Additional covariates** section is visible
2. Add one covariate (or leave empty) and take a screenshot of the section

If the template does not allow free covariates, select a different template that does (e.g. a deep auto-regressive template) for this screenshot only.

---

### Step 6: Save the Configured Model
**File:** `configure-step-6-save.png`

1. Scroll to ensure the **Save** button is visible with the full form summary above it
2. Take a screenshot showing the filled form and the primary Save button in the bottom right
