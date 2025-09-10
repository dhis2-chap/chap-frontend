import React from 'react'
import { CircularLoader } from '@dhis2/ui'
import { NewEvaluationForm } from '../NewEvaluationForm'
import { useInitialFormState } from '../../pages/NewEvaluationPage/hooks/useInitialFormState'
import styles from './NewEvaluationFormContainer.module.css'

export const NewEvaluationFormContainer = () => {
    const { initialValues, isLoading } = useInitialFormState()

    if (isLoading) {
        return (
            <div className={styles.loaderContainer}>
                <CircularLoader />
            </div>
        )
    }

    return (
        <NewEvaluationForm
            initialValues={initialValues}
        />
    )
}


