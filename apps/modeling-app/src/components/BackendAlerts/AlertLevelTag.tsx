import type { ReactNode } from 'react';
import { Tag } from '@dhis2/ui';
import { getAlertColor, type AlertLevelDisplay } from './alertLevelDisplay';
import styles from './BackendAlerts.module.css';

export const AlertLevelTag = ({ display, children }: { display: AlertLevelDisplay; children?: ReactNode }) => {
    const color = getAlertColor(display.color);
    return (
        <Tag>
            <span className={styles.levelTag} style={{ color: color.text }}>
                <span className={styles.colorDot} style={{ background: color.color }} />
                {children ?? display.label}
            </span>
        </Tag>
    );
};
