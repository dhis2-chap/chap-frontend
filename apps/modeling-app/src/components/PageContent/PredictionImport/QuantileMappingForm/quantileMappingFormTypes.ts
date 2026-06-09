import type {
    EndemicThresholdPoint,
    ModelSpecRead,
    PredictionInfo,
    PredictionOrgUnitSeries,
    PredictionSetupReadWithPredictions,
} from '@dhis2-chap/ui';

export type QuantileMappingFormProps = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
    predictionSetupId: number;
};

export type ThresholdMap = Map<string, EndemicThresholdPoint[]> | undefined;

export type LoadedQuantileMappingFormProps = QuantileMappingFormProps & {
    predictionSetup: PredictionSetupReadWithPredictions;
    series: PredictionOrgUnitSeries[];
    thresholdMap: ThresholdMap;
    unavailableThresholdCount: number;
    canDeleteDataValues?: boolean;
    isDeleteAuthorityLoading: boolean;
};
