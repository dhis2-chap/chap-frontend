import type { ReactNode } from 'react';
import {
    IconInfo24,
    IconWarning24,
    IconCheckmarkCircle24,
} from '@dhis2/ui-icons';
import styles from './Callout.module.css';

type CalloutType = 'info' | 'warning' | 'tip';

interface CalloutProps {
    type?: CalloutType;
    children: ReactNode;
}

const iconMap = {
    info: IconInfo24,
    warning: IconWarning24,
    tip: IconCheckmarkCircle24,
};

export const Callout = ({ type = 'info', children }: CalloutProps) => {
    const Icon = iconMap[type];

    return (
        <div className={`${styles.callout} ${styles[type]}`}>
            <span className={styles.icon}>
                <Icon />
            </span>
            <div className={styles.content}>{children}</div>
        </div>
    );
};
