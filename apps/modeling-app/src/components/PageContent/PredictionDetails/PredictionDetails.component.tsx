import React from 'react';
import styles from './PredictionDetails.module.css';
import { PredictionInfo, ModelSpecRead } from '@dhis2-chap/ui';
import { PredictionResultWidget } from './PredictionResultWidget/PredictionResultWidget.container';
import { QuickActionsWidget } from './QuickActionsWidget';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

export const PredictionDetailsComponent = ({
    prediction,
    model,
}: Props) => {
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

            </div>
        </div>
    );
};
