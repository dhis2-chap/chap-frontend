import { useEffect, useMemo } from 'react';
import {
    useSelectedEvaluationsController,
    useSelectedOrgUnits,
    useSelectedSplitPeriod,
} from './useSearchParamSelections';
import { useEvaluationOverlap } from '../../hooks/useEvaluationOverlap';
import { useOrgUnitsById } from '../../hooks/useOrgUnitsById';

export const useCompareSelectionController = ({
    maxSelectedOrgUnits = 10,
} = {}) => {
    const {
        evaluations,
        baseEvaluation,
        comparisonEvaluation,
        setBaseEvaluation,
        setComparisonEvaluation,
    } = useSelectedEvaluationsController();

    const selectedEvaluations = useMemo(
        () => [baseEvaluation, comparisonEvaluation].filter(e => !!e),
        [baseEvaluation, comparisonEvaluation],
    );

    const [selectedSplitPeriod, setSelectedSplitPeriod] =
        useSelectedSplitPeriod();

    const evaluationOverlap = useEvaluationOverlap({
        baseEvaluation: baseEvaluation?.id,
        comparisonEvaluation: comparisonEvaluation?.id,
    });

    const resolvedSplitPeriods = useMemo(
        () =>
            (evaluationOverlap.isSuccess
                ? evaluationOverlap.data.splitPeriods
                : baseEvaluation?.splitPeriods ?? []
            ).sort(),
        [evaluationOverlap.data, baseEvaluation?.splitPeriods],
    );

    const resolvedSelectedSplitPeriod =
        selectedSplitPeriod ?? resolvedSplitPeriods[0];

    const { availableOrgUnitIds, availableOrgUnitSet } = useMemo(() => {
        let availableOrgUnitIds = evaluationOverlap.data
            ? evaluationOverlap.data.orgUnits
            : baseEvaluation?.orgUnits ?? [];
        // dont fallback to base evaluation org units if the overlap is still fetching
        // this should prevent first fetching data for base eval units, then immediately fetching
        // the overlap units
        if (evaluationOverlap.isInitialLoading) {
            availableOrgUnitIds = [];
        }

        return {
            availableOrgUnitIds,
            availableOrgUnitSet: new Set(availableOrgUnitIds),
        };
    }, [evaluationOverlap.data, baseEvaluation?.orgUnits]);

    const { data: orgUnitsData } =
        useOrgUnitsById(availableOrgUnitIds);

    const [selectedOrgUnits, setSelectedOrgUnits] = useSelectedOrgUnits({
        initialValue: orgUnitsData?.organisationUnits
            .map(ou => ou.id)
            .slice(0, maxSelectedOrgUnits),
    });

    const compatibleSelectedOrgUnits = useMemo(
        () => selectedOrgUnits.filter(ou => availableOrgUnitSet.has(ou)),
        [selectedOrgUnits, availableOrgUnitSet],
    );

    const hasNoMatchingSplitPeriods =
        evaluationOverlap.isSuccess &&
        evaluationOverlap.data.splitPeriods.length === 0;

    // reset split period if not compatible
    useEffect(() => {
        if (
            resolvedSelectedSplitPeriod &&
            resolvedSplitPeriods.length > 0 &&
            !resolvedSplitPeriods.some(sp => sp === selectedSplitPeriod)
        ) {
            setSelectedSplitPeriod(undefined);
        }
    }, [resolvedSplitPeriods, selectedSplitPeriod]);

    return {
        selectedEvaluations,
        baseEvaluation,
        comparisonEvaluation,
        selectedSplitPeriod: resolvedSelectedSplitPeriod,
        selectedOrgUnits: compatibleSelectedOrgUnits,
        availableOrgUnitIds,
        evaluations,
        orgUnits: orgUnitsData?.organisationUnits,
        splitPeriods: resolvedSplitPeriods,
        hasNoMatchingSplitPeriods,
        setBaseEvaluation,
        setComparisonEvaluation,
        setSelectedOrgUnits,
        setSelectedSplitPeriod,
    };
};
