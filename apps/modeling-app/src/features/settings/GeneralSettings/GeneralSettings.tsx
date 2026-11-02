import styles from './GeneralSettings.module.css';
import { ChapSettings, RouteSettings, useRoute } from '@dhis2-chap/ui';

export const GeneralSettings = () => {
    const { route } = useRoute();

    return (
        <div className={styles.container}>
            <RouteSettings />

            {route && <ChapSettings route={route} />}
        </div>
    );
};
