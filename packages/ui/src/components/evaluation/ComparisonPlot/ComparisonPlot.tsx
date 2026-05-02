import React from 'react';
import styles from './ComparisonPlot.module.css';
import { ResultPlot, ZoomRange } from '../ResultPlot/ResultPlot';
import { EvaluationPerOrgUnit } from '../../../interfaces/Evaluation';

interface ComparisonPlotProps {
    orgUnitsData: EvaluationPerOrgUnit;
    nameLabel?: string;
    maxY?: number;
    zoomRange?: ZoomRange | null;
    onZoomChange?: (range: ZoomRange | null) => void;
}

export const ComparisonPlot = React.memo(function ComparisonPlot({
    orgUnitsData,
    nameLabel,
    maxY,
    zoomRange,
    onZoomChange,
}: ComparisonPlotProps) {
    return (
        <div className={styles.comparionBox}>
            <div className={styles.title}>{orgUnitsData.orgUnitName}</div>
            <div className={styles.comparionBoxSideBySide}>
                {orgUnitsData.models.map((modelData, index) => (
                    <div
                        key={`${orgUnitsData.orgUnitId}-${modelData.modelName}-${index}`}
                        className={styles.comparionBoxSideBySideItem}
                    >
                        <ResultPlot
                            data={modelData.data}
                            modelName={modelData.modelName}
                            nameLabel={nameLabel}
                            maxY={maxY}
                            zoomRange={zoomRange}
                            onZoomChange={onZoomChange}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
});
