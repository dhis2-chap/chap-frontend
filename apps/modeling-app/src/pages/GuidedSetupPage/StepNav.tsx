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
};

/** Moves between the steps of the guided setup. */
export const StepNav = ({ back, next, nextLabel, blockedReason }: Props) => {
    const navigate = useNavigate();
    return (
        <div className={styles.stepNav}>
            {back ? <Button onClick={() => navigate(back)}>{i18n.t('Back')}</Button> : <span />}
            {next && (
                <div className={styles.row}>
                    {blockedReason && <span className={styles.muted}>{blockedReason}</span>}
                    <Button primary disabled={!!blockedReason} onClick={() => navigate(next)} dataTest="guided-continue">
                        {nextLabel ?? i18n.t('Continue')}
                    </Button>
                </div>
            )}
        </div>
    );
};
