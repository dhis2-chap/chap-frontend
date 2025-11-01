import React, { useMemo, useState } from 'react';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { usePredictionEntries } from '../hooks/usePredictionEntries';
import { useOrgUnitsById } from '../../../../hooks/useOrgUnitsById';
import { useDataItemById } from '../../../../hooks/useDataItemById';
import { useActualCasesByDatasetId } from '../../../../hooks/useActualCasesByDatasetId';
import { PredictionResultWidgetComponent } from './PredictionResultWidget.component';
import styles from './PredictionResultWidget.module.css';
import { Widget, PredictionInfo, ModelSpecRead, buildPredictionSeries } from '@dhis2-chap/ui';
import { getLastNPeriods } from '@/utils/timePeriodUtils';
import { PERIOD_TYPES } from '@/components/ModelExecutionForm/constants';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

const WidgetWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <Widget
            header={i18n.t('Prediction result')}
            open
            onOpen={() => { }}
            onClose={() => { }}
        >
            {children}
        </Widget>
    );
};

const PERIODS_BY_PERIOD_TYPE = {
    [PERIOD_TYPES.DAY]: 365 * 2,
    [PERIOD_TYPES.WEEK]: 52 * 2,
    [PERIOD_TYPES.MONTH]: 12 * 2,
};

export const PredictionResultWidget = ({ prediction, model }: Props) => {
    const {
        orgUnits: orgUnitIds = [],
        dataset,
    } = prediction;

    const {
        predictionEntries,
        isLoading: isPredictionEntriesLoading,
        error: predictionEntriesError,
    } = usePredictionEntries(prediction.id);

    const {
        data: orgUnitsData,
        isLoading: isOrgUnitsLoading,
        error: orgUnitsError,
    } = useOrgUnitsById(orgUnitIds);

    const periods = useMemo(() => {
        if (!dataset.lastPeriod) return undefined;
        return getLastNPeriods(
            dataset.lastPeriod,
            dataset.periodType as keyof typeof PERIOD_TYPES,
            PERIODS_BY_PERIOD_TYPE[dataset.periodType?.toUpperCase() as keyof typeof PERIODS_BY_PERIOD_TYPE],
        );
    }, [dataset]);

    const {
        data: actualCasesData,
        isLoading: isActualCasesLoading,
        error: actualCasesError,
    } = useActualCasesByDatasetId({
        datasetId: dataset?.id,
        orgUnits: orgUnitIds,
        periods,
    });

    const predictionTargetId: string = dataset.dataSources?.find(
        dataSource => dataSource.covariate === model.target.name,
    )?.dataElementId ?? '';

    const { dataItem, isLoading: isDataItemLoading } = useDataItemById(predictionTargetId);

    const [selectedTab, setSelectedTab] = useState<'chart' | 'table' | 'map'>('chart');
    const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string | undefined>(undefined);

    const orgUnitsMap = useMemo(() => {
        const map = new Map<string, { id: string; displayName: string }>();
        orgUnitsData?.organisationUnits?.forEach((ou) => {
            map.set(ou.id, ou);
        });
        return map;
    }, [orgUnitsData]);

    const series = useMemo(() => {
        if (!predictionEntries.length || !orgUnitsMap.size) return [];
        return buildPredictionSeries(
            predictionEntries,
            orgUnitsMap,
            predictionTargetId,
            actualCasesData?.data,
        );
    }, [predictionEntries, orgUnitsMap, predictionTargetId, actualCasesData]);

    if (isPredictionEntriesLoading || isOrgUnitsLoading || isDataItemLoading || isActualCasesLoading) {
        return (
            <WidgetWrapper>
                <div className={styles.loadingContainer}>
                    <CircularLoader />
                </div>
            </WidgetWrapper>
        );
    }

    if (predictionEntriesError || orgUnitsError || actualCasesError) {
        return (
            <WidgetWrapper>
                <div className={styles.errorContainer}>
                    <NoticeBox title={i18n.t('Unable to load data')} error>
                        <p>{i18n.t('There was a problem loading required data. See the browser console for details.')}</p>
                    </NoticeBox>
                </div>
            </WidgetWrapper>
        );
    }

    if (!series || series.length === 0) {
        return (
            <WidgetWrapper>
                <div className={styles.errorContainer}>
                    <NoticeBox title={i18n.t('No data available')} warning>
                        <p>{i18n.t('No prediction data found.')}</p>
                    </NoticeBox>
                </div>
            </WidgetWrapper>
        );
    }

    return (
        <PredictionResultWidgetComponent
            series={series}
            predictionTargetName={dataItem?.displayName ?? predictionTargetId}
            selectedOrgUnitId={selectedOrgUnitId}
            selectedTab={selectedTab}
            onSelectOrgUnit={setSelectedOrgUnitId}
            onSelectTab={setSelectedTab}
        />
    );
};
