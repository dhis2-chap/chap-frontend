import i18n from '@dhis2/d2-i18n';
import { NoticeBox } from '@dhis2/ui';
import { Link, useParams } from 'react-router-dom';
import { ForecastReview } from '../../components/ForecastReview';
import { PageHeader } from '../../components/PageHeader';
import { ErrorNotice, Loading } from '../../components/StateViews';
import { usePendingPredictionAlerts } from '../../hooks/usePendingPredictionAlerts';
import styles from './PredictionPage.module.css';

export const PredictionPage = () => {
    const { predictionId } = useParams();
    const { prediction, alerts, policies, isLoading, error } = usePendingPredictionAlerts(Number(predictionId));

    if (isLoading) return <Loading />;
    if (error) return <ErrorNotice error={error} />;
    if (!prediction) return <NoticeBox error title={i18n.t('Prediction not found')} />;

    return (
        <>
            <Link className={styles.back} to="/review-queue">{i18n.t('Back to review queue')}</Link>
            <PageHeader
                title={prediction.name}
                description={i18n.t('Pending alerts from {{model}}. Select an organisation unit to review its forecast.', {
                    model: prediction.configuredModel?.name ?? prediction.modelId,
                })}
            />
            {alerts.length === 0 && (
                <NoticeBox title={i18n.t('No pending alerts')}>
                    {i18n.t('All alerts from this prediction have been reviewed.')}
                </NoticeBox>
            )}
            <ForecastReview prediction={prediction} alerts={alerts} policies={policies} />
        </>
    );
};
