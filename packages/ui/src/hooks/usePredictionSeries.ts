import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { getLastNPeriods, PERIOD_TYPES } from '@dhis2-chap/core';
import type { ModelSpecRead } from '../httpfunctions';
import type { PredictionInfo } from '../interfaces/Prediction';
import { buildPredictionSeries } from '../utils/PredictionViewModel';
import { useOrgUnitsById } from './useOrgUnitsById';
import { useDataItemById } from './useDataItemById';
import { useActualCasesByDatasetId } from './useActualCasesByDatasetId';
import { usePredictionEntries } from './usePredictionEntries';

const PERIODS_PER_YEAR_BY_PERIOD_TYPE = {
    [PERIOD_TYPES.DAY]: 365,
    [PERIOD_TYPES.WEEK]: 52,
    [PERIOD_TYPES.MONTH]: 12,
};

type Props = {
    prediction: PredictionInfo;
    // Without a model the target is unknown, so the series has no target data element.
    model?: Pick<ModelSpecRead, 'target'>;
    historyYears?: number;
};

export const usePredictionSeries = ({ prediction, model, historyYears = 2 }: Props) => {
    const {
        dataset,
    } = prediction;
    const orgUnitIds = prediction.orgUnits?.length
        ? prediction.orgUnits
        : dataset.orgUnits ?? [];

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
            PERIODS_PER_YEAR_BY_PERIOD_TYPE[dataset.periodType?.toUpperCase() as keyof typeof PERIODS_PER_YEAR_BY_PERIOD_TYPE] * historyYears,
        );
    }, [dataset, historyYears]);

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
        dataSource => dataSource.covariate === model?.target.name,
    )?.dataElementId ?? '';
    const shouldLoadPredictionTarget = !!predictionTargetId;

    const { dataItem, isLoading: isDataItemLoading } = useDataItemById(predictionTargetId);
    const isOrgUnitsQueryEnabled = orgUnitIds.length > 0;
    const isActualCasesQueryEnabled = !!dataset.id;

    const orgUnitsMap = useMemo(() => {
        const map = new Map<string, { id: string; displayName: string }>();
        orgUnitsData?.organisationUnits?.forEach((ou) => {
            map.set(ou.id, ou);
        });
        return map;
    }, [orgUnitsData]);

    const series = useMemo(() => {
        if (!predictionEntries.length || !orgUnitsMap.size) return [];
        const builtSeries = buildPredictionSeries(
            predictionEntries,
            orgUnitsMap,
            predictionTargetId,
            actualCasesData?.data,
            dataset.periodType as keyof typeof PERIOD_TYPES,
        );
        return builtSeries.sort((a, b) => a.orgUnitName.localeCompare(b.orgUnitName));
    }, [predictionEntries, orgUnitsMap, predictionTargetId, actualCasesData, dataset.periodType]);

    return {
        series,
        predictionTargetName: dataItem?.displayName ?? (predictionTargetId || model?.target.displayName || i18n.t('Cases')),
        isLoading: isPredictionEntriesLoading
            || (isOrgUnitsQueryEnabled && isOrgUnitsLoading)
            || (shouldLoadPredictionTarget && isDataItemLoading)
            || (isActualCasesQueryEnabled && isActualCasesLoading),
        error: predictionEntriesError || orgUnitsError || actualCasesError,
    };
};
