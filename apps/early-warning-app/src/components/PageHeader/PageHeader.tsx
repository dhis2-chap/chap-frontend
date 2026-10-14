import styles from './PageHeader.module.css';

type Props = {
    title: string;
    description?: string;
};

export const PageHeader = ({ title, description }: Props) => (
    <header className={styles.header}>
        <h1>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
    </header>
);
