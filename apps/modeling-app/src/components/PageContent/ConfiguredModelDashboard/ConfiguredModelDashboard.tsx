import { useCallback, useMemo } from 'react';
import type { PredictionInfo } from '@dhis2-chap/ui';
import { useParams, useSearchParams } from 'react-router-dom';
import { useConfiguredModelWithDataSource } from '../../../hooks/useConfiguredModelWithDataSource';
import { PredictionHistoryWidget } from './PredictionHistoryWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
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
    const [searchParams, setSearchParams] = useSearchParams();
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

    const selectedRunId = useMemo(() => {
        const runIdParam = searchParams.get('runId');
        if (!runIdParam) {
            return undefined;
        }

        const runId = Number(runIdParam);
        return Number.isFinite(runId) ? runId : undefined;
    }, [searchParams]);

    const selectedPrediction = useMemo(() => (
        predictions.find(prediction => prediction.id === selectedRunId) ?? predictions[0]
    ), [predictions, selectedRunId]);

    const handleSelectPrediction = useCallback((predictionId: number) => {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.set('runId', String(predictionId));
        setSearchParams(nextSearchParams, { replace: true });
    }, [searchParams, setSearchParams]);

    return (
        <div className={styles.container}>
            <div className={styles.leftColumn}>
                <PredictionHistoryWidget
                    error={error}
                    hasValidConfiguredId={hasValidConfiguredId}
                    isLoading={isLoading}
                    predictions={predictions}
                    selectedPredictionId={selectedPrediction?.id}
                    onSelectPrediction={handleSelectPrediction}
                />
            </div>
            <div className={styles.rightColumn}>
                <QuickActionsWidget
                    configuredId={configuredId}
                    configuredModelWithDataSource={configuredModelWithDataSource}
                    isLoading={isLoading}
                    selectedPredictionId={selectedPrediction?.id}
                />
            </div>
        </div>
    );
};
