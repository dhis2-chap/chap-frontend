import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { useParams } from 'react-router-dom';
import { PredictionDetailsComponent } from './PredictionDetails.component';
import { usePredictionById } from './hooks/usePredictionById';
import styles from './PredictionDetails.module.css';
import { useModels } from '@/hooks/useModels';

export const PredictionDetails: React.FC = () => {
    const { predictionId } = useParams<{ predictionId: string }>();
    const { prediction, isLoading: isPredictionLoading, error: predictionError } = usePredictionById(predictionId);
    const { models, isLoading: isModelsLoading, error: modelsError } = useModels();
    const model = useMemo(() => models?.find(m => m.name === prediction?.modelId), [models, prediction]);

    const isLoading = isPredictionLoading || isModelsLoading;
    const hasError = predictionError || modelsError;

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (hasError) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Error loading prediction')}>
                    {predictionError?.message || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    if (!prediction) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Prediction not found')}>
                    {i18n.t('The prediction you are looking for does not exist or you do not have permission to access it.')}
                </NoticeBox>
            </div>
        );
    }

    if (!model) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Model not found')}>
                    {i18n.t('The model you are looking for does not exist or you do not have permission to access it.')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <PredictionDetailsComponent
            prediction={prediction}
            model={model}
        />
    );
};
