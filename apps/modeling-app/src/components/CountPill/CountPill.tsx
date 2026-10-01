import { Tooltip } from '@dhis2/ui';
import { Pill } from '@dhis2-chap/ui';
import styles from './CountPill.module.css';

type Props = {
    count: number;
    tooltip: string;
};

export const CountPill = ({ count, tooltip }: Props) => {
    if (count === 0) {
        return count;
    }

    return (
        <div className={styles.cell}>
            <Tooltip content={tooltip}>
                {({ onMouseOver, onMouseOut, ref }) => (
                    <span
                        ref={ref}
                        className={styles.trigger}
                        onMouseEnter={onMouseOver}
                        onMouseLeave={onMouseOut}
                    >
                        <Pill>
                            {count}
                        </Pill>
                    </span>
                )}
            </Tooltip>
        </div>
    );
};
