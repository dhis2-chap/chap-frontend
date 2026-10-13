import styles from './GeneralSettings.module.css';
import { RouteSettings, useRoute } from '@dhis2-chap/ui';
import { ChapSettings } from '../ChapSettings';

export const GeneralSettings = () => {
    const { route } = useRoute();

    return (
        <div className={styles.container}>
            <RouteSettings />

            {route && <ChapSettings route={route} />}
        </div>
    );
};
