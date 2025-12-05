import React from 'react';
import { Pill } from '../Pill';
import { Ping } from '../Ping';
import styles from './StatusIndicator.module.css';

export type StatusIndicatorVariant = 'default' | 'destructive' | 'info' | 'warning' | 'success';

export type Props = {
    label: string;
    variant?: StatusIndicatorVariant;
    active?: boolean;
};

export const StatusIndicator = ({
    label,
    variant = 'default',
    active = false,
}: Props) => {
    return (
        <Pill variant={variant}>
            <div className={styles.contentWrapper}>
                <Ping
                    variant={variant}
                    active={active}
                />
                <span>{label}</span>
            </div>
        </Pill>
    );
};
