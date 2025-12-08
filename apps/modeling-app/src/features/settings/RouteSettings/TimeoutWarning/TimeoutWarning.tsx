import React from 'react';
import { NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Route } from '../../../../hooks/useRoute';

type Props = {
    route: Route;
};

export const TimeoutWarning = ({ route }: Props) => {
    const hasLowTimeout = route.responseTimeoutSeconds !== undefined && route.responseTimeoutSeconds < 10;

    if (!hasLowTimeout) {
        return null;
    }

    return (
        <NoticeBox title={i18n.t('Low response timeout')}>
            {i18n.t('The response timeout is currently set to {{timeout}} seconds. Consider increasing it to at least 10 seconds for a more reliable system.', { timeout: route.responseTimeoutSeconds })}
        </NoticeBox>
    );
};
