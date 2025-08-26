import React from 'react';
import cx from 'classnames';
import styles from './Ping.module.css';

export type PingVariant = 'default' | 'destructive' | 'info' | 'warning' | 'success';

export type Props = {
  active?: boolean;
  variant?: PingVariant;
}

export const Ping = ({ active = false, variant = 'default' }: Props) => {
  return (
    <span className={styles.wrapper}>
      <span className={cx(styles.ping, styles[variant], {
        [styles.active]: active,
      })} />
      <span
        className={cx(styles.dot, styles[variant])}
      />
    </span>
  );
};
