import React from 'react';
import cx from 'classnames';
import type { PlainProps } from './iconButton.types';
import styles from './iconButton.module.css';

export const IconButton = ({
    children,
    className,
    dataTest,
    onClick,
    disabled,
    ...passOnProps
}: PlainProps) => (
    <button
        {...passOnProps}
        onClick={onClick}
        disabled={disabled}
        data-test={dataTest}
        className={cx(styles.button, { disabled, ...(className ? { [className]: true } : {}) })}
        type="button"
        tabIndex={0}
    >
        {children}
    </button>
);
