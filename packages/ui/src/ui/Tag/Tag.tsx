import React, { ReactNode } from 'react';
import { IconCross16 } from '@dhis2/ui';
import cx from 'classnames';
import styles from './Tag.module.css';

export type TagVariant = 'default' | 'destructive' | 'info' | 'warning' | 'success';

interface TagProps {
    children: ReactNode;
    variant?: TagVariant;
    onRemove?: () => void;
    className?: string;
}

export const Tag = ({ children, variant = 'default', onRemove, className }: TagProps) => {
    return (
        <span
            className={cx(
                styles.tagWrapper,
                {
                    [styles.default]: variant === 'default',
                    [styles.destructive]: variant === 'destructive',
                    [styles.info]: variant === 'info',
                    [styles.warning]: variant === 'warning',
                    [styles.success]: variant === 'success',
                },
                className,
            )}
        >
            <span className={styles.tag}>
                <span className={styles.content}>{children}</span>
                {onRemove && (
                    <button
                        type="button"
                        className={styles.removeButton}
                        onClick={onRemove}
                        aria-label="Remove"
                    >
                        <IconCross16 />
                    </button>
                )}
            </span>
        </span>
    );
};
