import React from 'react';
import { CircularLoader } from '@dhis2/ui';
import { NewEvaluationForm } from '../NewEvaluationForm';
import { useInitialFormState } from '../../pages/NewEvaluationPage/hooks/useInitialFormState';
import styles from './NewEvaluationFormContainer.module.css';
import { useModels } from '../../hooks/useModels';

export const NewEvaluationFormContainer = () => {
    const { models, isLoading: isModelsLoading } = useModels();
    const { initialValues, isLoading } = useInitialFormState({ models });

    if (isLoading || isModelsLoading) {
        return (
            <div className={styles.loaderContainer}>
                <CircularLoader />
            </div>
        );
    }

    return (
        <NewEvaluationForm
            initialValues={initialValues}
        />
    );
};
