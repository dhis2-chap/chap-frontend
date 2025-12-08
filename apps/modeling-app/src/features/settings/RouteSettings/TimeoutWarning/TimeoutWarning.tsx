import React from 'react';
import { NoticeBox, Button } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Route } from '../../../../hooks/useRoute';
import { useUpdateRouteTimeout } from './useUpdateRouteTimeout';
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
        updateTimeout({ route, responseTimeoutSeconds: 30 });
    };

    return (
        <NoticeBox title={i18n.t('Low response timeout')}>
            <p>
                {i18n.t('The response timeout is currently set to {{timeout}} seconds. We recommend increasing it to 30 seconds for a more reliable system.', { timeout: route.responseTimeoutSeconds })}
            </p>
            <div className={styles.buttonContainer}>
                <Button
                    small
                    secondary
                    loading={isUpdating}
                    onClick={handleIncreaseTimeout}
                >
                    {i18n.t('Increase to 30 seconds')}
                </Button>
            </div>
        </NoticeBox>
    );
};
