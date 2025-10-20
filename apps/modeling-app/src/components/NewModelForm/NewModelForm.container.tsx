import React from 'react';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './NewModelForm.container.module.css';
import { useRoute } from '../../hooks/useRoute';
import { useModelTemplates } from '../../hooks/useModelTemplates';

export const NewModelFormContainer = () => {
    const {
        route,
        isLoading: isRouteLoading,
        isError: isRouteError,
        error: routeError,
    } = useRoute();

    const {
        modelTemplates,
        isLoading: isModelTemplatesLoading,
        error: modelTemplatesError,
    } = useModelTemplates({ route });

    if (isRouteLoading || isModelTemplatesLoading) {
        return (
            <div className={styles.loaderContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (isRouteError || modelTemplatesError) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Error loading model templates')}>
                    {routeError?.message
                        || modelTemplatesError?.message
                        || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    if (!route) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Route unavailable')}>
                    {i18n.t('Unable to determine the API route required to fetch model templates.')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <div>
            <NoticeBox title={i18n.t('Model templates loaded')}>
                {i18n.t('Loaded {{count}} model templates. The new model form will be implemented soon.', {
                    count: modelTemplates?.length ?? 0,
                })}
            </NoticeBox>
        </div>
    );
};

