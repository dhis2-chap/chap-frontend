import type {
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

export type LoadedQuantileMappingFormProps = QuantileMappingFormProps & {
    predictionSetup: PredictionSetupReadWithPredictions;
    series: PredictionOrgUnitSeries[];
    canDeleteDataValues?: boolean;
    isDeleteAuthorityLoading: boolean;
};
