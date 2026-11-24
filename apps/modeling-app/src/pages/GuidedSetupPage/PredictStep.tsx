import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader } from '@dhis2/ui';
import { StatusIndicator } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { JOB_STATUSES, JOB_TYPES, useJobs } from '../../hooks/useJobs';
import { usePredictionSetup } from '../../hooks/usePredictionSetup';
import { sortByCreatedDesc } from '../../utils/sortByCreated';
import styles from './GuidedSetupPage.module.css';

type Props = {
    predictionSetupId: number;
    /** Where to come back to after starting a prediction. */
    returnTo: string;
};

export const PredictStep = ({ predictionSetupId, returnTo }: Props) => {
    const navigate = useNavigate();
    const { predictionSetup, error } = usePredictionSetup(predictionSetupId);
    const { jobs } = useJobs({ predictionSetupId });
    const isRunning = jobs?.some(job => job.type === JOB_TYPES.MAKE_PREDICTION &&
        (job.status === JOB_STATUSES.PENDING || job.status === JOB_STATUSES.STARTED));
    const [latest] = sortByCreatedDesc(predictionSetup?.predictions ?? []);
    const path = `/predictions/${predictionSetupId}`;

    if (error) return <ChapErrorNotice error={error} title={i18n.t('Could not load the prediction setup')} />;
    if (!predictionSetup) return <CircularLoader small />;

    return (
        <div className={styles.setup} data-test={`guided-prediction-setup-${predictionSetupId}`}>
            <div>
                <p className={styles.setupName}>{predictionSetup.name}</p>
                <p className={styles.muted}>
                    {predictionSetup.configuredModel.modelTemplate?.displayName || predictionSetup.configuredModel.name}
                    {latest && ` · ${i18n.t('Latest prediction{{colon}} {{name}}', { colon: ':', name: latest.name })}`}
                </p>
            </div>
            <div className={styles.row}>
                {isRunning && <StatusIndicator variant="info" active label={i18n.t('Prediction running')} />}
                {latest && (
                    <Button onClick={() => navigate(`${path}/runs/${latest.id}`)}>{i18n.t('View latest prediction')}</Button>
                )}
                <Button onClick={() => navigate(path)}>{i18n.t('Open prediction setup')}</Button>
                <Button
                    primary={!latest}
                    disabled={isRunning}
                    onClick={() => navigate(`${path}/new?returnTo=${encodeURIComponent(returnTo)}`)}
                    dataTest="guided-run-prediction"
                >
                    {i18n.t('Run prediction')}
                </Button>
            </div>
        </div>
    );
};
