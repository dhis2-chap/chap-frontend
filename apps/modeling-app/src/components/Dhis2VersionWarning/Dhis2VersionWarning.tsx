import { useConfig } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { Button, IconCross16, IconErrorFilled24 } from '@dhis2/ui';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import styles from './Dhis2VersionWarning.module.css';

const STORAGE_KEY = 'chap-modeling-app:hide-dhis2-version-warning';
const WARNING_VERSION = '1';
const EXPIRATION_DAYS = 30;

export const Dhis2VersionWarning = () => {
    const { serverVersion } = useConfig();
    const [isWarningDismissed, setIsWarningDismissed] = useLocalStorage(
        STORAGE_KEY,
        false,
        {
            currentVersion: WARNING_VERSION,
            expirationDays: EXPIRATION_DAYS,
        },
    );

    if (serverVersion?.major !== 2 || serverVersion.minor !== 40) {
        return null;
    }

    if (isWarningDismissed) {
        return null;
    }

    return (
        <div className={styles.warning}>
            <div className={styles.warningInner}>
                <div className={styles.message}>
                    <span className={styles.errorIcon}>
                        <IconErrorFilled24 color="#b7160b" />
                    </span>
                    <span className={styles.messageText}>
                        {i18n.t('DHIS2 2.40 is no longer supported. Some functionality may not work on this instance. Please upgrade DHIS2 to get the latest features.')}
                    </span>
                </div>
                <div className={styles.actions}>
                    <Button
                        small
                        secondary
                        title={i18n.t('Dismiss')}
                        aria-label={i18n.t('Dismiss')}
                        dataTest="dhis2-version-warning-dismiss-button"
                        icon={<IconCross16 />}
                        onClick={() => setIsWarningDismissed(true)}
                    />
                </div>
            </div>
        </div>
    );
};
