import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

export const PageHeader = ({ title, children }: { title: string; children?: ReactNode }) => (
    <header className={styles.header}>
        <h1>{title}</h1>
        {children}
    </header>
);
