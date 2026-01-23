import { NoticeBox, Button } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Route } from '../../../../hooks/useRoute';
import { useUpdateRouteTimeout } from './useUpdateRouteTimeout';
import { RECOMMENDED_TIMEOUT_SECONDS } from '../constants';
import styles from './TimeoutWarning.module.css';

type Props = {
    route: Route;
};

export const TimeoutWarning = ({ route }: Props) => {
    const { updateTimeout, isUpdating } = useUpdateRouteTimeout();

    const hasLowTimeout = route.responseTimeoutSeconds !== undefined && route.responseTimeoutSeconds < 10;

    if (!hasLowTimeout) {
        return null;
    }

    const handleIncreaseTimeout = () => {
        updateTimeout({ route, responseTimeoutSeconds: RECOMMENDED_TIMEOUT_SECONDS });
    };

    return (
        <NoticeBox title={i18n.t('Low response timeout')}>
            <p>
                {i18n.t('The response timeout is currently set to {{timeout}} seconds. This may cause long-running requests to fail before they complete. We recommend increasing it to {{recommended}} seconds.', { timeout: route.responseTimeoutSeconds, recommended: RECOMMENDED_TIMEOUT_SECONDS })}
            </p>
            <div className={styles.buttonContainer}>
                <Button
                    small
                    secondary
                    loading={isUpdating}
                    onClick={handleIncreaseTimeout}
                >
                    {i18n.t('Increase to {{recommended}} seconds', { recommended: RECOMMENDED_TIMEOUT_SECONDS })}
                </Button>
            </div>
        </NoticeBox>
    );
};
