import React, { useCallback } from 'react';
import { EvaluationPerOrgUnit } from '../../../interfaces/Evaluation';
import { ComparisonPlot } from '../ComparisonPlot/ComparisonPlot';
import { ZoomRange } from '../ResultPlot/ResultPlot';
import { Virtuoso, VirtuosoProps } from 'react-virtuoso';

interface ComparisonPlotListProps {
    evaluationPerOrgUnits: EvaluationPerOrgUnit[];
    useVirtuoso?: boolean;
    useVirtuosoWindowScroll?: boolean;
    virtuosoProps?: VirtuosoProps<any, any>;
    nameLabel?: string;
    maxYByOrgUnitId?: Record<string, number>;
    zoomRange?: ZoomRange | null;
    onZoomChange?: (range: ZoomRange | null) => void;
}

const VIRTUOSO_STYLE = { height: '100%' } as const;

export const ComparisonPlotList = React.memo(function ComparisonPlotList({
    evaluationPerOrgUnits,
    useVirtuoso = true,
    useVirtuosoWindowScroll = false,
    virtuosoProps,
    nameLabel,
    maxYByOrgUnitId,
    zoomRange,
    onZoomChange,
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
                zoomRange={zoomRange}
                onZoomChange={onZoomChange}
            />
        );
    }, [evaluationPerOrgUnits, maxYByOrgUnitId, nameLabel, zoomRange, onZoomChange]);

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
                            zoomRange={zoomRange}
                            onZoomChange={onZoomChange}
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
