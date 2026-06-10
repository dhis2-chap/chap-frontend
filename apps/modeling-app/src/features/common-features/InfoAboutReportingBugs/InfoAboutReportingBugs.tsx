import { useState } from 'react';
import styles from './InfoAboutReportingBugs.module.css';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    IconCross16,
    IconInfoFilled24,
} from '@dhis2/ui';
import { IconMessages16 } from '@dhis2/ui-icons';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { ReportBugDialog } from '../ReportBugDialog/ReportBugDialog';

const STORAGE_KEY = 'chap-modeling-app:hide-reporting-bugs-warning';
const WARNING_VERSION = '1';
const EXPIRATION_DAYS = 30;

const InfoAboutReportingBugs = () => {
    const [isReportBugDialogOpen, setIsReportBugDialogOpen] = useState(false);
    const [isWarningDismissed, setIsWarningDismissed] = useLocalStorage(
        STORAGE_KEY,
        false,
        {
            currentVersion: WARNING_VERSION,
            expirationDays: EXPIRATION_DAYS,
        },
    );

    const handleDismiss = () => {
        setIsWarningDismissed(true);
    };

    return (
        <>
            <div className={styles.infoAboutReportingBugs}>
                {!isWarningDismissed && (
                    <div className={styles.infoAboutReportingBugsInner}>
                        <div className={styles.message}>
                            <span className={styles.infoIcon}>
                                <IconInfoFilled24 color="#093371" />
                            </span>
                            <span className={styles.messageText}>
                                {i18n.t('This is an alpha version of the Modeling App. Some features may change or contain bugs.')}
                            </span>
                        </div>
                        <div className={styles.actions}>
                            <Button
                                small
                                secondary
                                icon={<IconMessages16 />}
                                dataTest="report-bugs-open-dialog-button"
                                onClick={() => setIsReportBugDialogOpen(true)}
                            >
                                {i18n.t('Report a bug')}
                            </Button>
                            <Button
                                small
                                secondary
                                title={i18n.t('Dismiss')}
                                aria-label={i18n.t('Dismiss')}
                                icon={<IconCross16 />}
                                onClick={handleDismiss}
                            />
                        </div>
                    </div>
                )}
            </div>
            {isReportBugDialogOpen && (
                <ReportBugDialog
                    onClose={() => setIsReportBugDialogOpen(false)}
                />
            )}
        </>
    );
};

export default InfoAboutReportingBugs;
