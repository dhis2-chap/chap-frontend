import React, { useCallback } from 'react';
import { EvaluationPerOrgUnit } from '../../../interfaces/Evaluation';
import { ComparisonPlot } from '../ComparisonPlot/ComparisonPlot';
import { Virtuoso, VirtuosoProps } from 'react-virtuoso';

interface ComparisonPlotListProps {
    evaluationPerOrgUnits: EvaluationPerOrgUnit[];
    useVirtuoso?: boolean;
    useVirtuosoWindowScroll?: boolean;
    virtuosoProps?: VirtuosoProps<any, any>;
    nameLabel?: string;
    maxYByOrgUnitId?: Record<string, number>;
}

const VIRTUOSO_STYLE = { height: '100%' } as const;

export const ComparisonPlotList = React.memo(function ComparisonPlotList({
    evaluationPerOrgUnits,
    useVirtuoso = true,
    useVirtuosoWindowScroll = false,
    virtuosoProps,
    nameLabel,
    maxYByOrgUnitId,
}: ComparisonPlotListProps) {
    const renderItem = useCallback((index: number) => {
        const orgUnitsData = evaluationPerOrgUnits[index];

        if (!orgUnitsData) {
            return null;
        }

        return (
            <ComparisonPlot
                orgUnitsData={orgUnitsData}
                nameLabel={nameLabel}
                maxY={maxYByOrgUnitId?.[orgUnitsData.orgUnitId]}
            />
        );
    }, [evaluationPerOrgUnits, maxYByOrgUnitId, nameLabel]);

    const computeItemKey = useCallback(
        (index: number) => evaluationPerOrgUnits[index]?.orgUnitId ?? index,
        [evaluationPerOrgUnits],
    );

    if (!useVirtuoso) {
        return (
            <>
                {evaluationPerOrgUnits.map((orgUnitsData) => {
                    if (!orgUnitsData) {
                        return null;
                    }

                    return (
                        <ComparisonPlot
                            key={orgUnitsData.orgUnitId}
                            orgUnitsData={orgUnitsData}
                            nameLabel={nameLabel}
                            maxY={maxYByOrgUnitId?.[orgUnitsData.orgUnitId]}
                        />
                    );
                })}
            </>
        );
    }

    return (
        <Virtuoso
            {...virtuosoProps}
            computeItemKey={computeItemKey}
            style={VIRTUOSO_STYLE}
            useWindowScroll={useVirtuosoWindowScroll}
            totalCount={evaluationPerOrgUnits.length}
            itemContent={renderItem}
        />
    );
});
