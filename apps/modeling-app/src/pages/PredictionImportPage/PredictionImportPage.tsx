import { useParams } from 'react-router-dom';
import {
    CircularLoader,
    NoticeBox,
} from '@dhis2/ui';
import { Card } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './PredictionImportPage.module.css';
import { usePredictionById } from '../../components/PageContent/PredictionDetails/hooks/usePredictionById';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { PredictionImport } from '../../components/PageContent/PredictionImport';
import { useModels } from '../../hooks/useModels';

export const PredictionImportPage: React.FC = () => {
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
                pageTitle={i18n.t('Import prediction')}
                pageDescription={i18n.t('Import the forecasted values of this prediction into DHIS2.')}
            />
            <Card className={styles.container}>
                <PredictionImport
                    prediction={prediction}
                    model={model}
                />
            </Card>
        </>
    );
};
