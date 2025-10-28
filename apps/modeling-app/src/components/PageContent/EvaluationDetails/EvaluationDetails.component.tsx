import React from 'react';
import { MetricPlotWidget } from './MetricPlot';
import styles from './EvaluationDetails.module.css';

type Props = {
    evaluationId: number;
};

export const EvaluationDetailsComponent = ({ evaluationId }: Props) => {
    return (
        <div className={styles.container}>
            <div className={styles.leftColumn}>
                <MetricPlotWidget
                    evaluationId={evaluationId}
                />
            </div>
            <div className={styles.rightColumn}>

            </div>
        </div>
    );
};
