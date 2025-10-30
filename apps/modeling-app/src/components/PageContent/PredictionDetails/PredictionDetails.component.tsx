import React from 'react';
import styles from './PredictionDetails.module.css';
import { PredictionInfo, ModelSpecRead } from '@dhis2-chap/ui';
import { PredictionResultWidget } from './PredictionResultWidget/PredictionResultWidget.container';
import { PredictionSummaryWidget } from './PredictionSummaryWidget';

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
                <PredictionResultWidget
                    prediction={prediction}
                    model={model}
                />
            </div>
            <div className={styles.rightColumn}>
                <PredictionSummaryWidget
                    predictionId={prediction.id}
                />
            </div>
        </div>
    );
};
