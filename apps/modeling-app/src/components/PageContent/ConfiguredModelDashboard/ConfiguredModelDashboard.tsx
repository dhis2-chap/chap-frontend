import { useMemo } from 'react';
import type { PredictionInfo } from '@dhis2-chap/ui';
import { useParams } from 'react-router-dom';
import { useConfiguredModelWithDataSource } from '../../../hooks/useConfiguredModelWithDataSource';
import { OverviewWidget } from './OverviewWidget';
import { PredictionRunsWidget } from './PredictionRunsWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { SummaryWidget } from './SummaryWidget';
import styles from './ConfiguredModelDashboard.module.css';

const getCreatedTime = (created?: string | null) => {
    if (!created) {
        return 0;
    }

    const time = Date.parse(created);
    return Number.isNaN(time) ? 0 : time;
};

const getLatestPredictions = (predictions?: PredictionInfo[]) => (
    [...(predictions || [])]
        .sort((first, second) => getCreatedTime(second.created) - getCreatedTime(first.created))
);

export const ConfiguredModelDashboard: React.FC = () => {
    const { configuredId } = useParams();
    const {
        configuredModelWithDataSource,
        error,
        hasValidConfiguredId,
        isLoading,
    } = useConfiguredModelWithDataSource(configuredId);

    const predictions = useMemo(() => (
        hasValidConfiguredId
            ? getLatestPredictions(configuredModelWithDataSource?.predictions)
            : []
    ), [configuredModelWithDataSource?.predictions, hasValidConfiguredId]);

    return (
        <div className={styles.container}>
            <div className={styles.leftColumn}>
                <PredictionRunsWidget
                    configuredId={configuredId}
                    error={error}
                    hasValidConfiguredId={hasValidConfiguredId}
                    isLoading={isLoading}
                    predictions={predictions}
                />
            </div>
            <div className={styles.rightColumn}>
                <QuickActionsWidget
                    configuredId={configuredId}
                    configuredModelWithDataSource={configuredModelWithDataSource}
                    isLoading={isLoading}
                    latestPredictionId={predictions[0]?.id}
                />
                <OverviewWidget
                    configuredId={configuredId}
                    hasValidConfiguredId={hasValidConfiguredId}
                    isLoading={isLoading}
                    predictions={predictions}
                />
                <SummaryWidget
                    configuredModelWithDataSource={configuredModelWithDataSource}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};
