import { useConfig } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { NoticeBox } from '@dhis2/ui';
import styles from './Dhis2VersionWarning.module.css';

export const Dhis2VersionWarning = () => {
    const { serverVersion } = useConfig();

    if (serverVersion?.major !== 2 || serverVersion.minor !== 40) {
        return null;
    }

    return (
        <div className={styles.container}>
            <NoticeBox warning title={i18n.t('DHIS2 2.40 is no longer supported')}>
                {i18n.t(
                    'Support for DHIS2 2.40 is deprecated. Some functionality may not work on this instance. Please contact your administrator to upgrade DHIS2.',
                )}
            </NoticeBox>
        </div>
    );
};
