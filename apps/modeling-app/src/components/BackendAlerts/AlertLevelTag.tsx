import type { ReactNode } from 'react';
import { Tag } from '@dhis2/ui';
import { getAlertColor, type AlertLevelDisplay } from './alertLevelDisplay';
import styles from './BackendAlerts.module.css';

export const AlertLevelTag = ({ display, children }: { display: AlertLevelDisplay; children?: ReactNode }) => {
    const color = getAlertColor(display.color);
    return (
        // Tag caps its width at 240px by default, which cut off long level descriptions.
        <Tag maxWidth="100%">
            <span className={styles.levelTag} title={typeof children === 'string' ? children : display.label}>
                <span className={styles.colorDot} style={{ background: color.color }} />
                {children ?? display.label}
            </span>
        </Tag>
    );
};
