import React, { useState } from 'react'
import NewDatasetDrawer from '../new-dataset/components/NewDatasetDrawer/NewDatasetDrawer'
import { PageHeader } from '../common-features/PageHeader/PageHeader'
import JobResults from '../job-results/JobResults'

const EvaluationOverview = () => {
    const [newDatasetDrawerOpen, setNewDatasetDrawerOpen] =
        useState<boolean>(false)

    const onDrawerSubmit = () => {
        setNewDatasetDrawerOpen(false)
    }

    return (
        <div>
            <PageHeader
                pageTitle="Evaluation Datasets"
                pageDescription="Historical data used to evaluate the accuracy of predictive models, combining DHIS2 and climate data sources."
                setDrawerOpenText="New Dataset"
                setDrawerOpen={setNewDatasetDrawerOpen}
            />
            <JobResults type="datasets" />
            <NewDatasetDrawer
                isOpen={newDatasetDrawerOpen}
                onDrawerClose={() => setNewDatasetDrawerOpen(false)}
                onDrawerSubmit={onDrawerSubmit}
            />

            <PageHeader
                pageTitle="Model Evaluations"
                pageDescription="Evaluates the accuracy of a predictive model using historical data. Compares actual outcomes with predicted values to assess model performance."
            />
            <JobResults type="evaluations" />
        </div>
    )
}

export default EvaluationOverview
