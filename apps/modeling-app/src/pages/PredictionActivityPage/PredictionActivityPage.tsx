import i18n from '@dhis2/d2-i18n';
import { Button, IconArrowLeft16, NoticeBox } from '@dhis2/ui';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { JobsContent } from '../../components/PageContent/Jobs';
import styles from './PredictionActivityPage.module.css';

export const PredictionActivityPage: React.FC = () => {
    const { predictionSetupId } = useParams();
    const navigate = useNavigate();
    const parsedPredictionSetupId = Number(predictionSetupId);
    const hasValidPredictionSetupId = Number.isFinite(parsedPredictionSetupId);

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Activity')}
                pageDescription={i18n.t('View and manage jobs for this prediction setup.')}
            />
            <div className={styles.backButton}>
                <Button
                    small
                    icon={<IconArrowLeft16 />}
                    onClick={() => navigate(`/predictions/${predictionSetupId}`)}
                    disabled={!hasValidPredictionSetupId}
                >
                    {i18n.t('Back to prediction setup')}
                </Button>
            </div>
            {hasValidPredictionSetupId ? (
                <JobsContent
                    predictionSetupId={parsedPredictionSetupId}
                    visibleFilters={['status']}
                />
            ) : (
                <NoticeBox error title={i18n.t('Invalid prediction setup')}>
                    {i18n.t('The prediction setup id in the URL is not valid.')}
                </NoticeBox>
            )}
        </>
    );
};
