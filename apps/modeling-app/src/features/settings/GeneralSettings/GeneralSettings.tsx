import styles from './GeneralSettings.module.css';
import { RouteSettings } from '../RouteSettings';
import { ChapSettings } from '../ChapSettings';
import { useRoute } from '../../../hooks/useRoute';

export const GeneralSettings = () => {
    const { route } = useRoute();

    return (
        <div className={styles.container}>
            <RouteSettings />

            {route && <ChapSettings route={route} />}
        </div>
    );
};
