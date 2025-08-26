import React, { ReactNode } from 'react';
import cx from 'classnames';
import styles from './Pill.module.css';

export type PillVariant = 'default' | 'destructive' | 'info' | 'warning' | 'success';

interface PillProps {
    children: ReactNode;
    variant?: PillVariant;
}

export const Pill = ({ children, variant = 'default' }: PillProps) => {
    return (
        <span
            className={cx(styles.pillWrapper, {
                [styles.default]: variant === 'default',
                [styles.destructive]: variant === 'destructive',
                [styles.info]: variant === 'info',
                [styles.warning]: variant === 'warning',
                [styles.success]: variant === 'success',
            })}
        >
            <div className={styles.pill}>
                {children}
            </div>
        </span>
    );
}; 