import i18n from '@dhis2/d2-i18n';
import { useInitialFormState } from '@/pages/NewEvaluationPage/hooks/useInitialFormState';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { useLocation } from 'react-router-dom';
import { z } from 'zod';
import styles from './NewPredictionContent.module.css';
import { useModels } from '@/hooks/useModels';
import { NewPredictionForm } from '@/components/NewPredictionForm';

const predictionLocationStateSchema = z
    .object({
        configuredModelWithDataSourceId: z.number().int().positive().optional(),
    })
    .passthrough()
    .optional();

export const NewPredictionContent = () => {
    const location = useLocation();
    const { models, isLoading: isModelsLoading, error: modelsError } = useModels();
    const { initialValues, isLoading } = useInitialFormState({ models, isModelsLoading });
    const { data: predictionLocationState } = predictionLocationStateSchema.safeParse(location.state);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
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
        <NewPredictionForm
            configuredModelWithDataSourceId={predictionLocationState?.configuredModelWithDataSourceId}
            initialValues={initialValues}
        />
    );
};
