import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { Widget } from '@dhis2-chap/ui';
import styles from './EvaluationSummaryWidget.module.css';

type Props = {
    evaluationId: number;
};

export const EvaluationSummaryWidget = ({ evaluationId }: Props) => {
    return (
        <div className={styles.container}>
            <Widget
                header={i18n.t('Summary')}
                open
                onOpen={() => {}}
                onClose={() => {}}
            >
                <div className={styles.content}>
                    <p>
                        {i18n.t('This is a summary of the evaluation {{evaluationId}}.', { evaluationId })}
                    </p>
                </div>
            </Widget>
        </div>
    );
};
