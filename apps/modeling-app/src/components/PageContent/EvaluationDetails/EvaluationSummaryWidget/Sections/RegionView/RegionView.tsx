import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { Tag } from '@dhis2-chap/ui';
import styles from '../../EvaluationSummaryWidget.module.css';

type Props = {
    orgUnits?: string[] | null;
};

export const RegionView = ({ orgUnits }: Props) => {
    if (!orgUnits) {
        return null;
    }

    return (
        <div className={styles.row}>
            <span className={styles.label}>
                {i18n.t('Locations')}
            </span>
            <span className={styles.value}>
                <Tag variant="info">
                    {i18n.t('{{count}} locations', {
                        count: orgUnits.length,
                        defaultValue: '{{count}} location',
                        defaultValue_plural: '{{count}} locations',
                    })}
                </Tag>
            </span>
        </div>
    );
};
