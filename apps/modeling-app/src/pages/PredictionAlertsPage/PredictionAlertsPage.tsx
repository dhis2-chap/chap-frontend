import { useParams } from 'react-router-dom';
import {
    CircularLoader,
    NoticeBox,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { usePredictionById } from '../../components/PageContent/PredictionDetails/hooks/usePredictionById';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { PredictionAlerts } from '../../components/PageContent/PredictionAlerts';
import { useModels } from '../../hooks/useModels';
import styles from './PredictionAlertsPage.module.css';

export const PredictionAlertsPage: React.FC = () => {
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
                pageTitle={i18n.t('Configure outbreak alerts')}
                pageDescription={i18n.t('Choose the minimum outbreak probability and review forecast periods that will be imported as outbreak alerts.')}
            />
            <PredictionAlerts
                prediction={prediction}
                model={model}
            />
        </>
    );
};
