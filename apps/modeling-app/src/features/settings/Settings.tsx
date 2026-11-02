import styles from './Settings.module.css';
import { ChapSettings, RouteSettings, useRoute } from '@dhis2-chap/ui';

export const SettingsPage = () => {
    const { route } = useRoute();

    return (
        <div className={styles.settingsContainer}>
            <RouteSettings />

            {route && <ChapSettings route={route} />}

        </div>
    );
};
