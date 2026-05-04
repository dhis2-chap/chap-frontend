import i18n from '@dhis2/d2-i18n';
import { Widget } from '@dhis2-chap/ui';
import { useState } from 'react';
import styles from './MonitoringWidget.module.css';

export const MonitoringWidget = () => {
    const [open, setOpen] = useState(false);

    return (
        <Widget
            header={i18n.t('Monitoring')}
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
        >
            <div className={styles.placeholder}>
                {i18n.t('Monitoring data will appear here.')}
            </div>
        </Widget>
    );
};
