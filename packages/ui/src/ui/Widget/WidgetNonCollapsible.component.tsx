import React from 'react';
import { colors } from '@dhis2/ui';
import cx from 'classnames';
import type { WidgetNonCollapsiblePropsPlain } from './widgetNonCollapsible.types';
import styles from './Widget.module.css';

type Props = WidgetNonCollapsiblePropsPlain;

export const WidgetNonCollapsible = ({
    header,
    children,
    color = colors.white,
    borderless = false,
}: Props) => (
    <div
        className={cx(styles.container, { [styles.borderless]: borderless })}
        style={{ backgroundColor: color }}
    >
        <div
            className={styles.headerNonCollapsible}
            data-test="widget-header"
        >
            {header}
        </div>
        <div
            className={styles.contents}
            data-test="widget-contents"
        >
            {children}
        </div>
    </div>
);
