import type { ReactNode } from 'react';
import { Tag } from '@dhis2/ui';
import { ALERT_COLORS, type AlertLevelDisplay } from './alertLevelDisplay';
import styles from './BackendAlerts.module.css';

export const AlertLevelTag = ({ display, children }: { display: AlertLevelDisplay; children?: ReactNode }) => (
    <Tag>
        <span className={styles.levelTag} style={{ color: ALERT_COLORS[display.color].color }}>
            <span className={styles.colorDot} style={{ background: ALERT_COLORS[display.color].color }} />
            {children ?? display.label}
        </span>
    </Tag>
);
