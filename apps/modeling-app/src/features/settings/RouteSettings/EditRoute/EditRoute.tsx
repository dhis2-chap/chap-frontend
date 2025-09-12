import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { useSaveRoute } from '../hooks/useSaveRoute';
import { RouteForm, RouteFormValues } from '../RouteForm';
import type { Route } from '../../../../hooks/useRoute';

interface EditRouteProps {
    route: Route;
    onClose: () => void;
}

export const EditRoute = ({ route, onClose }: EditRouteProps) => {
    const { saveRoute, isSaving } = useSaveRoute({
        onSuccess: () => {
            onClose();
        },
    });

    const handleSubmit = (data: RouteFormValues) => {
        saveRoute({ id: route.id, url: data.url });
    };

    return (
        <RouteForm
            onClose={onClose}
            onSubmit={handleSubmit}
            isLoading={isSaving}
            initialUrl={route.url}
            modalTitle={i18n.t('Edit route')}
            submitButtonText={i18n.t('Save')}
        />
    );
};
