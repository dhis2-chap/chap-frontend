import { Button, ButtonProps } from '@dhis2/ui';
import styles from './TableActionButton.module.css';

/** Small secondary button for table rows that keeps its padding when the label wraps. */
export const TableActionButton = (props: ButtonProps) => (
    <span className={styles.wrapper}>
        <Button small secondary {...props} />
    </span>
);
