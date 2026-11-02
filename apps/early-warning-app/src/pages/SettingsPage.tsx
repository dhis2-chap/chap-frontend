import i18n from '@dhis2/d2-i18n';
import { ChapSettings, RouteSettings, useRoute } from '@dhis2-chap/ui';
import { PageHeader } from '../components/PageHeader';
import styles from './SettingsPage.module.css';

export const SettingsPage = () => {
    const { route } = useRoute();

    return (
        <>
            <PageHeader title={i18n.t('Settings')} />
            <div className={styles.container}>
                <RouteSettings />
                {route && <ChapSettings route={route} />}
            </div>
        </>
    );
};
