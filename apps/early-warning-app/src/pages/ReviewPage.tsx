import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { Link, useParams } from 'react-router-dom';
import { useReviewData } from '../hooks/useReviewData';

export const ReviewPage = () => {
    const { predictionId } = useParams();
    const review = useReviewData(Number(predictionId));
    if (review.isLoading) return <CircularLoader />;
    if (review.error || !review.prediction) return (
        <NoticeBox error title={i18n.t('Unable to load prediction')}>
            {review.error instanceof Error ? review.error.message : i18n.t('Prediction not found.')}
        </NoticeBox>
    );
    return (
        <>
            <Link to="/review-queue">{i18n.t('Review queue')}</Link>
            <h1>{review.prediction.name}</h1>
            <p>{review.prediction.configuredModel?.name ?? review.prediction.modelId}</p>
            <ul>
                {review.alerts.map(alert => (
                    <li key={alert.id}>
                        {alert.orgUnit}
                        {' '}
                        ·
                        {' '}
                        {alert.timePeriod}
                        {' '}
                        ·
                        {' '}
                        {alert.level}
                    </li>
                ))}
            </ul>
        </>
    );
};
