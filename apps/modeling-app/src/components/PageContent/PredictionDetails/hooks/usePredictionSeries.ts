import { useMemo } from 'react';
import {
    buildPredictionSeries,
    getLastNPeriods,
    ModelSpecRead,
    PERIOD_TYPES,
    PredictionInfo,
} from '@dhis2-chap/ui';
import { useOrgUnitsById } from '../../../../hooks/useOrgUnitsById';
import { useDataItemById } from '../../../../hooks/useDataItemById';
import { useActualCasesByDatasetId } from '../../../../hooks/useActualCasesByDatasetId';
import { usePredictionEntries } from './usePredictionEntries';

const PERIODS_BY_PERIOD_TYPE = {
    [PERIOD_TYPES.DAY]: 365 * 2,
    [PERIOD_TYPES.WEEK]: 52 * 2,
    [PERIOD_TYPES.MONTH]: 12 * 2,
};

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

export const usePredictionSeries = ({ prediction, model }: Props) => {
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
        predictionTargetName: dataItem?.displayName ?? predictionTargetId,
        isLoading: isPredictionEntriesLoading
            || isOrgUnitsLoading
            || isDataItemLoading
            || isActualCasesLoading,
        error: predictionEntriesError || orgUnitsError || actualCasesError,
    };
};
