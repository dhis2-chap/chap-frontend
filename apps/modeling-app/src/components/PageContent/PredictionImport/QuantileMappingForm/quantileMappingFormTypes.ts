import type { AlertPolicyRead, ModelSpecRead, PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import type { PredictionInfo, PredictionOrgUnitSeries } from '@chap-blocks/ui/utils';

export type QuantileMappingFormProps = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
    predictionSetupId: number;
};

export type LoadedQuantileMappingFormProps = QuantileMappingFormProps & {
    predictionSetup: PredictionSetupReadWithPredictions;
    policy: AlertPolicyRead | null | undefined;
    series: PredictionOrgUnitSeries[];
    canDeleteDataValues?: boolean;
    isDeleteAuthorityLoading: boolean;
};
