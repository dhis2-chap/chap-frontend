import { useParams } from 'react-router-dom';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { usePredictionById } from '../../components/PageContent/PredictionDetails/hooks/usePredictionById';
import { useModels } from '../../hooks/useModels';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { SignalReview } from '../../components/BackendAlerts/SignalReview';
import styles from '../PredictionRunDetailsPage/PredictionRunDetailsPage.module.css';

export const PredictionSignalReviewPage: React.FC = () => {
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
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (isError) {
        return (
            <div className={styles.errorContainer}>
                <ChapErrorNotice error={error} title={i18n.t('Error loading prediction')} />
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

    if (modelsError || !model) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Model not found')}>
                    {i18n.t('The model for this prediction could not be loaded.')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Review signals')}
                pageDescription={i18n.t('Approve signals to clear them for dissemination. Expand an organisation unit to see the forecast behind its signals.')}
            />
            <div className={styles.content}>
                <SignalReview prediction={prediction} model={model} />
            </div>
        </>
    );
};
