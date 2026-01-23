import i18n from '@dhis2/d2-i18n';
import { MetricPlotWidget } from './MetricPlot';
import { CustomEvaluationPlotsWidget } from './CustomEvaluationPlots';
import { QuickActionsWidget } from './QuickActionsWidget';
import { ModelExecutionResultWidget } from './ModelExecutionResultWidget';
import styles from './EvaluationDetails.module.css';
import { useBacktestById } from '@/hooks/useBacktestById';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { EvaluationSummaryWidget } from './EvaluationSummaryWidget';
import { useExperimentalFeature, FEATURES } from '@/features/settings/Experimental';

type Props = {
    evaluationId: number;
};

export const EvaluationDetailsComponent = ({ evaluationId }: Props) => {
    const { backtest, isLoading: isBacktestLoading, error: backtestError } = useBacktestById(evaluationId);
    const { enabled: isMetricPlotsEnabled } = useExperimentalFeature(FEATURES.METRIC_PLOTS);
    const { enabled: isEvaluationPlotsEnabled } = useExperimentalFeature(FEATURES.EVALUATION_PLOTS);

    if (isBacktestLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (backtestError) {
        console.error('EvaluationDetails: error loading backtest', {
            message: backtestError?.message,
            error: backtestError,
            evaluationId,
        });
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Unable to load data')}>
                    <p>{i18n.t('There was a problem loading required data. See the browser console for details.')}</p>
                </NoticeBox>
            </div>
        );
    }

    if (!backtest) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox warning title={i18n.t('No data available')}>
                    <p>{i18n.t('The evaluation you are looking for does not exist or you do not have permission to access it.')}</p>
                </NoticeBox>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.leftColumn}>
                <QuickActionsWidget
                    evaluationId={evaluationId}
                />
                <ModelExecutionResultWidget
                    backtest={backtest}
                />
                {isEvaluationPlotsEnabled && (
                    <CustomEvaluationPlotsWidget
                        evaluationId={evaluationId}
                    />
                )}
                {isMetricPlotsEnabled && (
                    <MetricPlotWidget
                        evaluationId={evaluationId}
                    />
                )}
            </div>
            <div className={styles.rightColumn}>
                <EvaluationSummaryWidget
                    evaluationId={evaluationId}
                />
            </div>
        </div>
    );
};
