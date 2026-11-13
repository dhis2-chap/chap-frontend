import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import type { ModelSpecRead, PredictionInfo } from '@dhis2-chap/ui';
import { ChapErrorNotice } from '@/components/ChapErrorNotice';
import { usePredictionById } from '@/components/PageContent/PredictionDetails/hooks/usePredictionById';
import { useModels } from '@/hooks/useModels';
import styles from './PredictionRunLoader.module.css';

type Props = {
    children: (run: { prediction: PredictionInfo; model: ModelSpecRead }) => ReactNode;
};

// Loads the prediction run in the route and its model, which every page about a run needs.
export const PredictionRunLoader = ({ children }: Props) => {
    const { predictionId } = useParams();
    const { prediction, error, isLoading, isError } = usePredictionById(predictionId);
    const {
        models,
        error: modelsError,
        isLoading: isModelsLoading,
    } = useModels({ includeArchived: true });
    const model = models?.find(modelSpec => modelSpec.name === prediction?.modelId);

    if (isLoading || (prediction && isModelsLoading)) {
        return (
            <div className={styles.loading}>
                <CircularLoader />
            </div>
        );
    }

    if (isError) {
        return (
            <div className={styles.error}>
                <ChapErrorNotice error={error} title={i18n.t('Error loading prediction')} />
            </div>
        );
    }

    if (!prediction) {
        return (
            <div className={styles.error}>
                <NoticeBox error title={i18n.t('Prediction not found')}>
                    {i18n.t('The prediction you are looking for does not exist or you do not have permission to access it.')}
                </NoticeBox>
            </div>
        );
    }

    if (modelsError || !model) {
        return (
            <div className={styles.error}>
                <NoticeBox error title={i18n.t('Model not found')}>
                    {i18n.t('The model for this prediction could not be loaded.')}
                </NoticeBox>
            </div>
        );
    }

    return <>{children({ prediction, model })}</>;
};
