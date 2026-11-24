import type { ReactNode } from 'react';
import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import { Button, IconCheckmark16 } from '@dhis2/ui';
import styles from './GuidedSetupPage.module.css';

type Props = {
    number: number;
    title: string;
    /** What the step is for, shown until the step has a result to summarise. */
    description: string;
    /** The result of the step, shown once it is done. */
    summary?: ReactNode;
    isDone: boolean;
    isOpen: boolean;
    /** Shown on a finished step while it is closed, to open it again. */
    action?: ReactNode;
    /** Set when the step was opened again, to return to the step in progress. */
    onClose?: () => void;
    children: ReactNode;
};

export const Step = ({ number, title, description, summary, isDone, isOpen, action, onClose, children }: Props) => (
    <section
        className={cx(styles.step, { [styles.upcoming]: !isDone && !isOpen })}
        data-test={`guided-step-${number}`}
        aria-current={isOpen ? 'step' : undefined}
    >
        <div className={cx(styles.marker, { [styles.done]: isDone, [styles.current]: isOpen && !isDone })} aria-hidden>
            {isDone ? <IconCheckmark16 /> : number}
        </div>
        <div className={styles.stepMain}>
            <div className={styles.stepHeader}>
                <div>
                    <h3 className={styles.stepTitle}>{title}</h3>
                    <p className={styles.stepSummary}>{isDone && summary ? summary : description}</p>
                </div>
                {isOpen ? onClose && <Button small onClick={onClose}>{i18n.t('Close')}</Button> : isDone && action}
            </div>
            {isOpen && <div className={styles.stepBody}>{children}</div>}
        </div>
    </section>
);
