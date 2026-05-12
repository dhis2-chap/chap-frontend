import {
    Button,
    IconExportItems24,
    IconSettings24,
    IconView24,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useState } from 'react';
import { PERIOD_TYPES, Widget } from '@dhis2-chap/ui';
import type { DataImportMapping, PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';
import { MarkReadyForForecastingModal } from '../../EvaluationDetails/QuickActionsWidget/MarkReadyForForecastingModal';
import type { MarkReadyForForecastingFormValues } from '../../EvaluationDetails/QuickActionsWidget/MarkReadyForForecastingModal';
import { getPredictionSetupDataImportMappings } from '@/utils/predictionSetupImportMapping';
import { useUpdatePredictionSetup } from './hooks/useUpdatePredictionSetup';
import styles from './QuickActionsWidget.module.css';

type PredictionFormLocationState = {
    name?: string;
    periodType?: typeof PERIOD_TYPES.WEEK | typeof PERIOD_TYPES.MONTH;
    fromDate?: string;
    orgUnits?: string[];
    modelId?: string;
    predictionSetupId?: number;
    dataSources?: {
        covariate: string;
        dataElementId: string;
    }[];
};

type Props = {
    configuredId?: string;
    predictionSetup?: PredictionSetupReadWithPredictions;
    isLoading: boolean;
    latestPredictionId?: number;
};

const getPeriodType = (
    periodType?: string | null,
): PredictionFormLocationState['periodType'] | undefined => {
    const normalizedPeriodType = periodType?.toUpperCase();

    if (
        normalizedPeriodType === PERIOD_TYPES.WEEK
        || normalizedPeriodType === PERIOD_TYPES.MONTH
    ) {
        return normalizedPeriodType;
    }

    return undefined;
};

const buildPredictionFormState = (
    predictionSetup: PredictionSetupReadWithPredictions,
): PredictionFormLocationState => {
    const configuredModelWithDataSource = predictionSetup.configuredModelWithDataSource;
    const periodType = getPeriodType(configuredModelWithDataSource.periodType);
    const state: PredictionFormLocationState = {
        name: i18n.t('{{name}} prediction', {
            name: predictionSetup.name,
        }),
        predictionSetupId: predictionSetup.id,
        orgUnits: configuredModelWithDataSource.orgUnits,
        dataSources: configuredModelWithDataSource.dataSources.map(dataSource => ({
            covariate: dataSource.covariate,
            dataElementId: dataSource.dataElementId,
        })),
    };

    if (configuredModelWithDataSource.configuredModel?.id) {
        state.modelId = String(configuredModelWithDataSource.configuredModel.id);
    }

    if (periodType) {
        state.periodType = periodType;

        if (configuredModelWithDataSource.startPeriod) {
            state.fromDate = configuredModelWithDataSource.startPeriod;
        }
    }

    return state;
};

const quantileKeys = [
    'quantile_high',
    'quantile_mid_high',
    'median',
    'quantile_mid_low',
    'quantile_low',
] as const;

const getDataElementId = (
    dataImportMappings: DataImportMapping[],
    quantileKey: typeof quantileKeys[number],
) => (
    dataImportMappings.find(mapping => mapping.quantileKey === quantileKey)?.dataElementId ?? ''
);

const buildEditSetupFormValues = (
    predictionSetup: PredictionSetupReadWithPredictions,
): MarkReadyForForecastingFormValues => {
    const dataImportMappings = getPredictionSetupDataImportMappings(predictionSetup);

    return {
        name: predictionSetup.name,
        use_import_mapping: dataImportMappings.length > 0,
        quantile_high: getDataElementId(dataImportMappings, 'quantile_high'),
        quantile_mid_high: getDataElementId(dataImportMappings, 'quantile_mid_high'),
        median: getDataElementId(dataImportMappings, 'median'),
        quantile_mid_low: getDataElementId(dataImportMappings, 'quantile_mid_low'),
        quantile_low: getDataElementId(dataImportMappings, 'quantile_low'),
    };
};

const buildDataImportMappings = (
    values: MarkReadyForForecastingFormValues,
): DataImportMapping[] => {
    if (!values.use_import_mapping) {
        return [];
    }

    return quantileKeys.map(quantileKey => ({
        quantileKey,
        dataElementId: values[quantileKey],
    }));
};

export const QuickActionsWidget = ({
    configuredId,
    predictionSetup,
    isLoading,
    latestPredictionId,
}: Props) => {
    const navigate = useNavigate();
    const [configurationModalIsOpen, setConfigurationModalIsOpen] = useState(false);
    const { updatePredictionSetup, isUpdating } = useUpdatePredictionSetup();
    const canPredict = !!configuredId && !!predictionSetup?.configuredModelWithDataSource.configuredModel?.id;

    const handlePredict = () => {
        if (!predictionSetup) {
            return;
        }

        const returnTo = `/predictions/${configuredId}`;
        navigate(
            `/predictions/${configuredId}/new?returnTo=${encodeURIComponent(returnTo)}`,
            { state: buildPredictionFormState(predictionSetup) },
        );
    };

    const handleShowLastRun = () => {
        if (!configuredId || !latestPredictionId) {
            return;
        }

        navigate(`/predictions/${configuredId}/runs/${latestPredictionId}`);
    };

    const handleEditSetup = () => {
        setConfigurationModalIsOpen(true);
    };

    const handleEditSetupSubmit = async (values: MarkReadyForForecastingFormValues) => {
        if (!predictionSetup) {
            return;
        }

        const dataImportMappings = buildDataImportMappings(values);

        await updatePredictionSetup({
            predictionSetupId: predictionSetup.id,
            data: {
                name: values.name,
                dataImportMappings,
            },
        });
        setConfigurationModalIsOpen(false);
    };

    return (
        <>
            <Widget
                header={i18n.t('Quick actions')}
                noncollapsible
            >
                <div className={styles.content}>
                    <div className={styles.actionList}>
                        <Button
                            dataTest="quick-action-predict"
                            icon={<span className={styles.actionIcon}><IconExportItems24 /></span>}
                            onClick={handlePredict}
                            loading={isLoading}
                            disabled={!canPredict}
                            className={styles.actionButton}
                            primary
                        >
                            {i18n.t('Run prediction')}
                        </Button>
                        <Button
                            dataTest="quick-action-show-last-run"
                            icon={<span className={styles.actionIcon}><IconView24 /></span>}
                            onClick={handleShowLastRun}
                            disabled={!latestPredictionId}
                            className={styles.actionButton}
                        >
                            {i18n.t('Go to last run')}
                        </Button>
                        <Button
                            dataTest="quick-action-configuration"
                            icon={<span className={styles.actionIcon}><IconSettings24 /></span>}
                            onClick={handleEditSetup}
                            disabled={!predictionSetup}
                            className={styles.actionButton}
                        >
                            {i18n.t('Edit setup')}
                        </Button>
                    </div>
                </div>
            </Widget>

            {configurationModalIsOpen && predictionSetup && (
                <MarkReadyForForecastingModal
                    onClose={() => setConfigurationModalIsOpen(false)}
                    onSubmit={handleEditSetupSubmit}
                    defaultValues={buildEditSetupFormValues(predictionSetup)}
                    title={i18n.t('Edit prediction setup')}
                    isSubmitting={isUpdating}
                />
            )}
        </>
    );
};
