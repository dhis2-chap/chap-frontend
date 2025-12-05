import React from 'react';
import { Card } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import Markdown from 'react-markdown';
import styles from './GuidesPage.module.css';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';

const testMarkdownContent = `
# Getting Started with CHAP

Welcome to the Climate-sensitive Health Analytics Platform (CHAP). This guide will help you understand the basics of using the modeling application.

## What is CHAP?

CHAP is a platform designed to help public health officials and epidemiologists create predictive models for disease forecasting. It integrates with DHIS2 to leverage existing health data infrastructure.

## Key Features

### Model Configuration
You can configure predictive models by:
- Selecting a model template
- Mapping data elements from DHIS2
- Defining geographical and temporal parameters

### Evaluation (Backtesting)
Evaluate your models by comparing predictions against historical data:
1. Select a configured model
2. Choose a time period for evaluation
3. Review the results and metrics

### Predictions
Generate forecasts for future periods:
- Create predictions using trained models
- Review uncertainty quantification
- Import results back into DHIS2

## Quick Start

To get started with CHAP:

1. Navigate to **Models** to create a new model configuration
2. Go to **Evaluate** to test your model against historical data
3. Use **Predict** to generate forecasts

> **Tip:** Start with a simple model configuration and gradually add more covariates as you understand the system better.

## Code Example

Here's an example of how data is structured:

\`\`\`json
{
  "modelId": 1,
  "periodType": "Monthly",
  "orgUnits": ["ou123", "ou456"]
}
\`\`\`

## Need Help?

If you encounter any issues, check the **Jobs** page to monitor background tasks and view logs.

| Feature | Description |
|---------|-------------|
| Evaluate | Test model accuracy |
| Predict | Generate forecasts |
| Models | Configure models |
| Jobs | Monitor tasks |
`;

export const GuidesPage: React.FC = () => {
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Guides')}
                pageDescription={i18n.t('Documentation and guides for using the CHAP modeling application.')}
            />
            <Card className={styles.container}>
                <div className={styles.markdownContent}>
                    <Markdown>{testMarkdownContent}</Markdown>
                </div>
            </Card>
        </>
    );
};
