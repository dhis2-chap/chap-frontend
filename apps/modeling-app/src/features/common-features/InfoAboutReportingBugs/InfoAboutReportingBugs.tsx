import React from 'react';
import styles from './InfoAboutReportingBugs.module.css';
import { Button, IconCross16, IconWarning16 } from '@dhis2/ui';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

const STORAGE_KEY = 'chap-modeling-app:hide-reporting-bugs-warning';
const WARNING_VERSION = '1';
const EXPIRATION_DAYS = 30;

const InfoAboutReportingBugs = () => {
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
        <div className={styles.infoAboutReportingBugs}>
            {!isWarningDismissed && (
                <div
                    className={styles.infoAboutReportingBugsInner}
                    style={{ maxInlineSize: '1400px' }}
                >
                    <div>
                        <span className={styles.icon}>
                            <IconWarning16 />
                        </span>
                        Please be aware that you are using an alpha version,
                        meaning you could experience bugs or issues. If you
                        encounter any problems, please report to:
                        {' '}
                        <a href="mailto:example@example.com?subject=Modeling App | Issue%20Report:&body=RELEVANT%20LOGS:%0ADESCRIBE%20YOUR%20ISSUE:%0AHOW%20TO%20REPRODUCE:%0AIF%20ALLOWED,%20ATTACH%20THE%20DATA%20USED%20WHEN%20FAILING,%20GET%20THE%20DATA%20BY%20USING%20THE%20'DOWNLOAD%20BUTTON.':">
                            chap@dhis2.org
                        </a>
                    </div>
                    <div>
                        <Button small onClick={handleDismiss}>
                            <IconCross16 />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfoAboutReportingBugs;
