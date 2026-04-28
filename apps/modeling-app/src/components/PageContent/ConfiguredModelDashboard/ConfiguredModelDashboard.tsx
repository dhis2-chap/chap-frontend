import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { Widget } from '@dhis2-chap/ui';
import type { ModelSpecRead, PredictionInfo } from '@dhis2-chap/ui';
import { useParams, useSearchParams } from 'react-router-dom';
import { useConfiguredModelWithDataSource } from '../../../hooks/useConfiguredModelWithDataSource';
import { useModels } from '../../../hooks/useModels';
import { PredictionResultWidget } from '../PredictionDetails/PredictionResultWidget/PredictionResultWidget.container';
import { PredictionHistoryWidget } from './PredictionHistoryWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import styles from './ConfiguredModelDashboard.module.css';

type SelectedPredictionResultProps = {
    isLoadingHistory: boolean;
    model?: ModelSpecRead;
    modelsError?: unknown;
    isLoadingModels: boolean;
    prediction: PredictionInfo | undefined;
};

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

const WidgetWrapper = ({ children }: { children: ReactNode }) => (
    <Widget
        header={i18n.t('Prediction result')}
        noncollapsible
    >
        {children}
    </Widget>
);

const SelectedPredictionResult = ({
    isLoadingHistory,
    isLoadingModels,
    model,
    modelsError,
    prediction,
}: SelectedPredictionResultProps) => {
    if (isLoadingHistory || (prediction && isLoadingModels)) {
        return (
            <WidgetWrapper>
                <div className={styles.loadingState}>
                    <CircularLoader />
                </div>
            </WidgetWrapper>
        );
    }

    if (!prediction) {
        return (
            <WidgetWrapper>
                <div className={styles.emptyState}>
                    {i18n.t('No previous run selected')}
                </div>
            </WidgetWrapper>
        );
    }

    if (modelsError || !model) {
        return (
            <WidgetWrapper>
                <div className={styles.errorState}>
                    <NoticeBox error title={i18n.t('Model not found')}>
                        {i18n.t('The model for the selected prediction could not be loaded.')}
                    </NoticeBox>
                </div>
            </WidgetWrapper>
        );
    }

    return (
        <PredictionResultWidget
            prediction={prediction}
            model={model}
        />
    );
};

export const ConfiguredModelDashboard: React.FC = () => {
    const { configuredId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        configuredModelWithDataSource,
        error,
        hasValidConfiguredId,
        isLoading,
    } = useConfiguredModelWithDataSource(configuredId);
    const {
        models,
        error: modelsError,
        isLoading: isLoadingModels,
    } = useModels({ includeArchived: true });

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

    const selectedModel = useMemo(() => (
        models?.find(model => model.name === selectedPrediction?.modelId)
    ), [models, selectedPrediction?.modelId]);

    const handleSelectPrediction = useCallback((predictionId: number) => {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.set('runId', String(predictionId));
        setSearchParams(nextSearchParams, { replace: true });
    }, [searchParams, setSearchParams]);

    return (
        <div className={styles.container}>
            <div className={styles.leftColumn}>
                <SelectedPredictionResult
                    isLoadingHistory={isLoading}
                    isLoadingModels={isLoadingModels}
                    model={selectedModel}
                    modelsError={modelsError}
                    prediction={selectedPrediction}
                />
            </div>
            <div className={styles.rightColumn}>
                <QuickActionsWidget
                    configuredId={configuredId}
                    configuredModelWithDataSource={configuredModelWithDataSource}
                    isLoading={isLoading}
                />
                <PredictionHistoryWidget
                    error={error}
                    hasValidConfiguredId={hasValidConfiguredId}
                    isLoading={isLoading}
                    predictions={predictions}
                    selectedPredictionId={selectedPrediction?.id}
                    onSelectPrediction={handleSelectPrediction}
                />
            </div>
        </div>
    );
};
