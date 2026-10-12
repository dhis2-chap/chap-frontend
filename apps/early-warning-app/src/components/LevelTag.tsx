import styles from './LevelTag.module.css';

export const LevelTag = ({ level, colors }: { level: string; colors: Record<string, string> }) => (
    <span className={styles.tag}>
        <span className={styles.swatch} style={{ backgroundColor: colors[level] ?? '#e0e0e0' }} />
        {level}
    </span>
);
