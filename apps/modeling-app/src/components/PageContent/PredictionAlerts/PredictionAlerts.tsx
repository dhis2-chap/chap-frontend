import {
    DEFAULT_OUTBREAK_PROBABILITY,
    OUTBREAK_PROBABILITY_OPTIONS,
    OutbreakProbability,
    PredictionInfo,
    ModelSpecRead,
} from '@dhis2-chap/ui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useConfiguredModelWithDataSource } from '../../../hooks/useConfiguredModelWithDataSource';
import { PredictionAlertsConfigurator } from './PredictionAlertsConfigurator';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
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

export const PredictionAlerts = ({ prediction, model }: Props) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const configuredModelWithDataSourceId = prediction.configuredModelWithDataSource?.id;
    const {
        configuredModelWithDataSource,
        isLoading: isLoadingPredictionRuns,
    } = useConfiguredModelWithDataSource(
        configuredModelWithDataSourceId ? String(configuredModelWithDataSourceId) : undefined,
    );
    const selectedProbability = Number(searchParams.get('alertProbability')) as OutbreakProbability
        || DEFAULT_OUTBREAK_PROBABILITY;
    const normalizedProbability = OUTBREAK_PROBABILITY_OPTIONS.includes(selectedProbability)
        ? selectedProbability
        : DEFAULT_OUTBREAK_PROBABILITY;
    const predictionRuns = getLatestPredictions([
        ...(configuredModelWithDataSource?.predictions ?? []),
        ...(
            configuredModelWithDataSource?.predictions?.some(run => run.id === prediction.id)
                ? []
                : [prediction]
        ),
    ]);

    const handleSelectProbability = (probability: OutbreakProbability) => {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.set('alertProbability', String(probability));
        setSearchParams(nextSearchParams, { replace: true });
    };

    const handleSelectPrediction = (predictionId: number) => {
        if (!configuredModelWithDataSourceId) {
            return;
        }

        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.set('alertProbability', String(normalizedProbability));
        navigate(`/predictions/${configuredModelWithDataSourceId}/runs/${predictionId}/alerts?${nextSearchParams.toString()}`);
    };

    return (
        <PredictionAlertsConfigurator
            prediction={prediction}
            predictionRuns={predictionRuns}
            isLoadingPredictionRuns={isLoadingPredictionRuns}
            model={model}
            selectedProbability={normalizedProbability}
            onSelectPrediction={handleSelectPrediction}
            onSelectProbability={handleSelectProbability}
        />
    );
};
