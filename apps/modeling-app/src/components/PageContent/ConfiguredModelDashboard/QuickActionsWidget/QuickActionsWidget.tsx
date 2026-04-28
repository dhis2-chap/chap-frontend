import { Button, IconExportItems24, IconSettings16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { PERIOD_TYPES, Widget } from '@dhis2-chap/ui';
import type { ConfiguredModelWithDataSourceReadWithPredictions } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';
import styles from './QuickActionsWidget.module.css';

type PredictionFormLocationState = {
    name?: string;
    periodType?: typeof PERIOD_TYPES.WEEK | typeof PERIOD_TYPES.MONTH;
    fromDate?: string;
    orgUnits?: string[];
    modelId?: string;
    configuredModelWithDataSourceId?: number;
    dataSources?: {
        covariate: string;
        dataElementId: string;
    }[];
};

type Props = {
    configuredId?: string;
    configuredModelWithDataSource?: ConfiguredModelWithDataSourceReadWithPredictions;
    isLoading: boolean;
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
    configuredModelWithDataSource: ConfiguredModelWithDataSourceReadWithPredictions,
): PredictionFormLocationState => {
    const periodType = getPeriodType(configuredModelWithDataSource.periodType);
    const state: PredictionFormLocationState = {
        name: i18n.t('{{name}} prediction', {
            name: configuredModelWithDataSource.name,
        }),
        configuredModelWithDataSourceId: configuredModelWithDataSource.id,
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

export const QuickActionsWidget = ({
    configuredId,
    configuredModelWithDataSource,
    isLoading,
}: Props) => {
    const navigate = useNavigate();
    const canPredict = !!configuredModelWithDataSource?.configuredModel?.id;

    const handlePredict = () => {
        if (!configuredModelWithDataSource) {
            return;
        }

        const returnTo = `/predictions/${configuredId}`;
        navigate(
            `/predictions/new?returnTo=${encodeURIComponent(returnTo)}`,
            { state: buildPredictionFormState(configuredModelWithDataSource) },
        );
    };

    return (
        <Widget
            header={i18n.t('Quick actions')}
            noncollapsible
        >
            <div className={styles.content}>
                <div className={styles.actionList}>
                    <Button
                        dataTest="quick-action-predict"
                        icon={<IconExportItems24 />}
                        onClick={handlePredict}
                        loading={isLoading}
                        disabled={!canPredict}
                        className={styles.actionButton}
                        primary
                    >
                        {i18n.t('Predict')}
                    </Button>
                    <Button
                        dataTest="quick-action-thresholds"
                        icon={<IconSettings16 />}
                        className={styles.actionButton}
                    >
                        {i18n.t('Thresholds')}
                    </Button>
                </div>
            </div>
        </Widget>
    );
};
