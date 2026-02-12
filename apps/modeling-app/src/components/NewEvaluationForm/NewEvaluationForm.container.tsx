import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { NewEvaluationFormComponent } from './NewEvaluationForm.component';
import { useInitialFormState } from '../../pages/NewEvaluationPage/hooks/useInitialFormState';
import styles from './NewEvaluationForm.module.css';
import { useModels } from '../../hooks/useModels';

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
                <NoticeBox error title={i18n.t('Error loading models')}>
                    {modelsError.message || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <NewEvaluationFormComponent
            initialValues={initialValues}
        />
    );
};
