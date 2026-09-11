import i18n from '@dhis2/d2-i18n';
import { CircularLoader } from '@dhis2/ui';
import { NewEvaluationFormComponent } from './NewEvaluationForm.component';
import { useInitialFormState } from '../../pages/NewEvaluationPage/hooks/useInitialFormState';
import styles from './NewEvaluationForm.module.css';
import { useModels } from '../../hooks/useModels';
import { ChapErrorNotice } from '../ChapErrorNotice';

export const NewEvaluationForm = () => {
    const { models, isLoading: isModelsLoading, error: modelsError } = useModels();
    const { initialValues, isLoading } = useInitialFormState({ models, isModelsLoading });

    if (isLoading || isModelsLoading) {
        return (
            <div className={styles.loaderContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (modelsError) {
        return (
            <div className={styles.errorContainer}>
                <ChapErrorNotice error={modelsError} title={i18n.t('Error loading models')} />
            </div>
        );
    }

    return (
        <NewEvaluationFormComponent
            initialValues={initialValues}
        />
    );
};
