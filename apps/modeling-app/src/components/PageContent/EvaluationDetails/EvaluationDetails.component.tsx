import React from 'react';
import styles from './EvaluationDetails.module.css';
import { MetricPlotWidget } from './MetricPlot';
import { EvaluationSummaryWidget } from './EvaluationSummaryWidget';

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
                <EvaluationSummaryWidget
                    evaluationId={evaluationId}
                />
            </div>
        </div>
    );
};
