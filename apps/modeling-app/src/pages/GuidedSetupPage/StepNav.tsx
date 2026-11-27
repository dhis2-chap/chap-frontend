import type { ReactNode } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';
import styles from './GuidedSetupPage.module.css';

type Props = {
    back?: string;
    next?: string;
    nextLabel?: string;
    /** Why the next step cannot be opened yet. Disables the button. */
    blockedReason?: string;
    /** What the step does before the next one opens, in place of the button that only moves on. */
    action?: ReactNode;
    /** Said next to the action: what it covers, or why it cannot be done yet. */
    actionNote?: string;
};

/** Moves between the steps of the guided setup. */
export const StepNav = ({ back, next, nextLabel, blockedReason, action, actionNote }: Props) => {
    const navigate = useNavigate();
    const note = action ? actionNote : blockedReason;
    return (
        <div className={styles.stepNav}>
            {back ? <Button onClick={() => navigate(back)}>{i18n.t('Back')}</Button> : <span />}
            {(action || next) && (
                <div className={styles.stepNavAction}>
                    {note && <span className={styles.muted}>{note}</span>}
                    {action ?? (
                        <Button primary disabled={!!blockedReason} onClick={() => next && navigate(next)} dataTest="guided-continue">
                            {nextLabel ?? i18n.t('Continue')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
