import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { Tag } from '@dhis2-chap/ui';
import styles from '../../PredictionSummaryWidget.module.css';

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
                {i18n.t('Regions')}
            </span>
            <span className={styles.value}>
                <Tag variant="info">
                    {i18n.t('{{count}} regions', {
                        count: orgUnits.length,
                        defaultValue: '{{count}} region',
                        defaultValue_plural: '{{count}} regions',
                    })}
                </Tag>
            </span>
        </div>
    );
};
