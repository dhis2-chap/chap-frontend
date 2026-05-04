import { useNavigate, useParams } from 'react-router-dom';
import {
    Button,
    CircularLoader,
    IconArrowLeft16,
    NoticeBox,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { usePredictionById } from '../../components/PageContent/PredictionDetails/hooks/usePredictionById';
import { PredictionResultWidget } from '../../components/PageContent/PredictionDetails/PredictionResultWidget/PredictionResultWidget.container';
import { useModels } from '../../hooks/useModels';
import styles from './PredictionRunDetailsPage.module.css';

export const PredictionRunDetailsPage: React.FC = () => {
    const navigate = useNavigate();
    const { configuredId, predictionId } = useParams();
    const { prediction, error, isLoading, isError } = usePredictionById(predictionId);
    const {
        models,
        error: modelsError,
        isLoading: isModelsLoading,
    } = useModels({ includeArchived: true });
    const model = models?.find(modelSpec => modelSpec.name === prediction?.modelId);
    const returnTo = configuredId ? `/predictions/${configuredId}` : '/predictions';

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
                <NoticeBox error title={i18n.t('Error loading prediction') as string}>
                    {error?.message || (i18n.t('An unknown error occurred') as string)}
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
                pageTitle={i18n.t('Prediction run')}
                pageDescription={prediction.name || i18n.t('Unnamed prediction')}
            />
            <Button
                className={styles.backButton}
                small
                icon={<IconArrowLeft16 />}
                onClick={() => navigate(returnTo)}
            >
                {i18n.t('Back to prediction setup')}
            </Button>
            <div className={styles.content}>
                <PredictionResultWidget
                    prediction={prediction}
                    model={model}
                />
            </div>
        </>
    );
};
