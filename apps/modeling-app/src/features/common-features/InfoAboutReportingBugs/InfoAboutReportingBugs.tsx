import React, { useState } from 'react';
import styles from './InfoAboutReportingBugs.module.css';
import { Button, IconCross16, IconWarning16 } from '@dhis2/ui';

const InfoAboutReportingBugs = () => {
    const [closeWarning, setCloseWarning] = useState(true);

    return (
        <div className={styles.infoAboutReportingBugs}>
            {closeWarning && (
                <div
                    className={styles.infoAboutReportingBugsInner}
                    style={{ maxWidth: '1400px' }}
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
                        <Button
                            small
                            onClick={() => setCloseWarning(!closeWarning)}
                        >
                            <IconCross16 />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfoAboutReportingBugs;
