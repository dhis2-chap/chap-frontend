import React, { useMemo } from 'react';
import styles from './PredictionDetails.module.css';
import { PredictionInfo, ModelSpecRead } from '@dhis2-chap/ui';
import { PredictionResultWidget } from './PredictionResultWidget/PredictionResultWidget.container';
import { PredictionSummaryWidget } from './PredictionSummaryWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { ExplainabilityWidget } from './ExplainabilityWidget';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

export const PredictionDetailsComponent = ({
    prediction,
    model,
}: Props) => {
    const orgUnits = useMemo(() => prediction.orgUnits || [], [prediction]);
    const periods = useMemo(() => {
        const lastPeriod = prediction.dataset?.lastPeriod;
        if (!lastPeriod) return [];
        const nPeriods = prediction.nPeriods || 3;
        const periodsArr: string[] = [];
        for (let i = 0; i < nPeriods; i++) {
            periodsArr.push(`${lastPeriod}_${i + 1}`);
        }
        return periodsArr.length > 0 ? periodsArr : [lastPeriod];
    }, [prediction]);

    return (
        <div className={styles.container}>
            <div className={styles.leftColumn}>
                <QuickActionsWidget
                    predictionId={prediction.id}
                />
                <PredictionResultWidget
                    prediction={prediction}
                    model={model}
                />
            </div>
            <div className={styles.rightColumn}>
                <PredictionSummaryWidget
                    predictionId={prediction.id}
                />
                <ExplainabilityWidget
                    predictionId={prediction.id}
                    orgUnits={orgUnits}
                    periods={periods}
                />
            </div>
        </div>
    );
};
