import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { PredictionRunLoader } from '../../components/PredictionRunLoader';
import { SignalReview } from '../../components/BackendAlerts/SignalReview';
import styles from './PredictionSignalReviewPage.module.css';

export const PredictionSignalReviewPage: React.FC = () => (
    <PredictionRunLoader>
        {({ prediction, model }) => (
            <>
                <PageHeader
                    pageTitle={i18n.t('Review signals')}
                    pageDescription={i18n.t('Approve signals to clear them for dissemination. Expand an organisation unit to see the forecast behind its signals.')}
                />
                <div className={styles.content}>
                    {/* Keyed so a selection never carries over to another run. */}
                    <SignalReview key={prediction.id} prediction={prediction} model={model} />
                </div>
            </>
        )}
    </PredictionRunLoader>
);
