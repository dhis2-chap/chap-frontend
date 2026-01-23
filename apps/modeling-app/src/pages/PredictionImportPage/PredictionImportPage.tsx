import { useParams, useNavigate } from 'react-router-dom';
import {
    CircularLoader,
    NoticeBox,
    Button,
    IconArrowLeft16,
} from '@dhis2/ui';
import { Card } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './PredictionImportPage.module.css';
import { usePredictionById } from '../../components/PageContent/PredictionDetails/hooks/usePredictionById';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { PredictionImport } from '../../components/PageContent/PredictionImport';

export const PredictionImportPage: React.FC = () => {
    const { predictionId } = useParams();
    const navigate = useNavigate();
    const { prediction, error, isLoading, isError } = usePredictionById(predictionId);

    if (isLoading) {
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

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Import prediction')}
                pageDescription={i18n.t('Import the forecasted values of this prediction into DHIS2.')}
            />
            <div className={styles.backButton}>
                <Button
                    small
                    icon={<IconArrowLeft16 />}
                    onClick={() => navigate(`/predictions/${predictionId}`)}
                >
                    {i18n.t('Back to prediction details')}
                </Button>
            </div>
            <Card className={styles.container}>
                <PredictionImport
                    prediction={prediction}
                />
            </Card>
        </>
    );
};
