import i18n from '@dhis2/d2-i18n';
import { Button } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';
import { ConfiguredModelDashboard } from '../../components/PageContent/ConfiguredModelDashboard';
import { StepNav } from './StepNav';
import { useGuided } from './useGuidedProgress';
import styles from './GuidedSetupPage.module.css';

export const PredictPage = () => {
    const navigate = useNavigate();
    const { predictionSetupIds, pathTo } = useGuided();
    // A dataset usually has one promoted model; the newest wins when there are several.
    const [predictionSetupId] = predictionSetupIds;

    return (
        <>
            <div className={styles.sectionHeader}>
                <div>
                    <h3 className={styles.title}>{i18n.t('Run and review predictions')}</h3>
                    <p className={styles.description}>
                        {i18n.t('Run a prediction, review the signals it raises, and import the result into DHIS2. The monitoring chart shows whether the model keeps beating the baseline as real numbers come in.')}
                    </p>
                </div>
                <span className={styles.nowrap}>
                    <Button small onClick={() => navigate(`/predictions/${predictionSetupId}`)}>
                        {i18n.t('Activity, input data and scheduling')}
                    </Button>
                </span>
            </div>
            <ConfiguredModelDashboard predictionSetupId={String(predictionSetupId)} returnTo={pathTo('predict')} essentialsOnly />
            <StepNav back={pathTo('promote')} />
        </>
    );
};
