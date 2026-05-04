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
import { useConfiguredModelsWithDataSource } from '@/hooks/useConfiguredModelsWithDataSource';
import type { BackTestRead, ConfiguredModelWithDataSourceRead, DataSource } from '@dhis2-chap/ui';

type Props = {
    evaluationId: number;
};

const normalizePeriodType = (periodType?: string | null) => periodType?.toUpperCase();

const getOrgUnitKey = (orgUnits?: string[] | null) => (
    [...(orgUnits ?? [])].sort().join('|')
);

const getDataSourceKey = (dataSources?: DataSource[] | null) => (
    [...(dataSources ?? [])]
        .map(dataSource => `${dataSource.covariate}:${dataSource.dataElementId}`)
        .sort()
        .join('|')
);

const findPredictionSetupId = (
    backtest: BackTestRead,
    configuredModels: ConfiguredModelWithDataSourceRead[] = [],
) => {
    const configuredModelId = backtest.configuredModel?.id;

    if (!configuredModelId) {
        return undefined;
    }

    const candidates = configuredModels.filter(configuredModel =>
        configuredModel.configuredModel?.id === configuredModelId,
    );

    if (candidates.length <= 1) {
        return candidates[0]?.id;
    }

    const dataset = backtest.dataset;
    const datasetOrgUnitKey = getOrgUnitKey(dataset.orgUnits);
    const datasetDataSourceKey = getDataSourceKey(dataset.dataSources);
    const datasetPeriodType = normalizePeriodType(dataset.periodType);

    const exactMatch = candidates.find(configuredModel =>
        configuredModel.startPeriod === dataset.firstPeriod &&
        normalizePeriodType(configuredModel.periodType) === datasetPeriodType &&
        getOrgUnitKey(configuredModel.orgUnits) === datasetOrgUnitKey &&
        getDataSourceKey(configuredModel.dataSources) === datasetDataSourceKey,
    );

    return exactMatch?.id;
};

export const EvaluationDetailsComponent = ({ evaluationId }: Props) => {
    const { backtest, isLoading: isBacktestLoading, error: backtestError } = useBacktestById(evaluationId);
    const {
        configuredModels,
        isLoading: isConfiguredModelsLoading,
    } = useConfiguredModelsWithDataSource({
        enabled: !!backtest?.readyForFollowUp,
    });
    const { enabled: isMetricPlotsEnabled } = useExperimentalFeature(FEATURES.METRIC_PLOTS);
    const { enabled: isEvaluationPlotsEnabled } = useExperimentalFeature(FEATURES.EVALUATION_PLOTS);
    const predictionSetupId = backtest
        ? findPredictionSetupId(backtest, configuredModels)
        : undefined;

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
                <QuickActionsWidget
                    evaluationId={evaluationId}
                    readyForFollowUp={!!backtest.readyForFollowUp}
                    predictionSetupId={predictionSetupId}
                    predictionSetupIsLoading={isConfiguredModelsLoading}
                />
                <EvaluationSummaryWidget
                    evaluationId={evaluationId}
                />
            </div>
        </div>
    );
};
