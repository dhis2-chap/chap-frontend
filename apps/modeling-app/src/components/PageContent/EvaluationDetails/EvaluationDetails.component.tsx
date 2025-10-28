import React from 'react';
import { MetricPlotWidget } from './MetricPlot';
import { QuickActionsWidget } from './QuickActionsWidget';
import styles from './EvaluationDetails.module.css';
import { EvaluationSummaryWidget } from './EvaluationSummaryWidget';

type Props = {
    evaluationId: number;
};

export const EvaluationDetailsComponent = ({ evaluationId }: Props) => {
    return (
        <div className={styles.container}>
            <div className={styles.leftColumn}>
                <QuickActionsWidget
                    evaluationId={evaluationId}
                />
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
