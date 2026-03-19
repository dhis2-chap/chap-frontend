import i18n from '@dhis2/d2-i18n';
import { Button, IconChevronLeft16, IconChevronRight16 } from '@dhis2/ui';
import React, { useCallback, useState } from 'react';
import { EvaluationPerOrgUnit } from '../../../interfaces/Evaluation';
import { ComparisonPlot } from '../ComparisonPlot/ComparisonPlot';
import { ZoomRange } from '../ResultPlot/ResultPlot';
import { Virtuoso, VirtuosoProps } from 'react-virtuoso';
import styles from './ComparisonPlotList.module.css';

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
    const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);

    const shiftZoom = useCallback(
        (direction: 1 | -1) => {
            setZoomRange((prev) => {
                if (!prev) return null;

                const newMin = prev.min + direction;
                const newMax = prev.max + direction;

                if (newMin < prev.dataMin || newMax > prev.dataMax) return prev;

                return { ...prev, min: newMin, max: newMax };
            });
        },
        [],
    );

    const resetZoom = useCallback(() => {
        setZoomRange(null);
    }, []);

    const isZoomed = zoomRange !== null;
    const canShiftLeft = isZoomed && zoomRange.min > zoomRange.dataMin;
    const canShiftRight = isZoomed && zoomRange.max < zoomRange.dataMax;

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
                onZoomChange={setZoomRange}
            />
        );
    }, [evaluationPerOrgUnits, maxYByOrgUnitId, nameLabel, zoomRange]);

    const computeItemKey = useCallback(
        (index: number) => evaluationPerOrgUnits[index]?.orgUnitId ?? index,
        [evaluationPerOrgUnits],
    );

    const controls = (
        <div className={`${styles.zoomControls} ${!isZoomed ? styles.hidden : ''}`}>
            <Button
                small
                secondary
                disabled={!canShiftLeft}
                onClick={() => shiftZoom(-1)}
                aria-label={i18n.t('Shift zoom left one period')}
                icon={<IconChevronLeft16 />}
            />
            <Button
                small
                secondary
                onClick={resetZoom}
            >
                {i18n.t('Reset zoom')}
            </Button>
            <Button
                small
                secondary
                disabled={!canShiftRight}
                onClick={() => shiftZoom(1)}
                aria-label={i18n.t('Shift zoom right one period')}
                icon={<IconChevronRight16 />}
            />
        </div>
    );

    if (!useVirtuoso) {
        return (
            <div>
                {controls}
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
                            onZoomChange={setZoomRange}
                        />
                    );
                })}
            </div>
        );
    }

    return (
        <div>
            {controls}
            <Virtuoso
                {...virtuosoProps}
                computeItemKey={computeItemKey}
                style={VIRTUOSO_STYLE}
                useWindowScroll={useVirtuosoWindowScroll}
                totalCount={evaluationPerOrgUnits.length}
                itemContent={renderItem}
            />
        </div>
    );
});
