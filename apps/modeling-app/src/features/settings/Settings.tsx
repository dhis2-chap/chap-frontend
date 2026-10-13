import styles from './Settings.module.css';
import { RouteSettings, useRoute } from '@dhis2-chap/ui';
import { ChapSettings } from './ChapSettings';

export const SettingsPage = () => {
    const { route } = useRoute();

    return (
        <div className={styles.settingsContainer}>
            <RouteSettings />

            {route && <ChapSettings route={route} />}

        </div>
    );
};
