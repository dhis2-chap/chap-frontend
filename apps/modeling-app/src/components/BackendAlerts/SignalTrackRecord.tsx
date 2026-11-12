import i18n from '@dhis2/d2-i18n';
import { Link } from 'react-router-dom';
import { ChapErrorNotice } from '@/components/ChapErrorNotice';
import { OutbreakMetricsWidget } from '@/components/PageContent/EvaluationDetails/OutbreakMetricsWidget/OutbreakMetricsWidget';
import { usePredictionSetup } from '@/hooks/usePredictionSetup';
import styles from './BackendAlerts.module.css';

type Props = {
    // The policy that raised the run's signals.
    policyId: number;
    predictionSetupId?: number | null;
};

// How the policy behind a run's signals scored when the model was evaluated, as shown on the evaluation's own page.
// The scores pool every organisation unit, so they describe the run and not one of its organisation units.
export const SignalTrackRecord = ({ policyId, predictionSetupId }: Props) => {
    const { predictionSetup, error } = usePredictionSetup(predictionSetupId ?? undefined);
    if (error) {
        return <ChapErrorNotice error={error} title={i18n.t('Could not load the evaluation scores')} />;
    }
    // A prediction made without a setup has no evaluation to score.
    const evaluationId = predictionSetup?.backtestId;
    if (evaluationId == null) return null;

    return (
        <OutbreakMetricsWidget
            evaluationId={evaluationId}
            policyId={policyId}
            intro={(
                <>
                    {i18n.t('How well this policy\'s signals matched observed outbreaks when the model was evaluated on past data, across all splits and organisation units.')}
                    {' '}
                    <Link className={styles.link} to={`/evaluate/${evaluationId}`}>{i18n.t('View evaluation')}</Link>
                </>
            )}
        />
    );
};
