import i18n from '@dhis2/d2-i18n';
import { useSaveRoute } from '../hooks/useSaveRoute';
import { RouteForm, RouteFormValues } from '../RouteForm';
import { hasRouteToken } from '../routeToken';
import type { Route } from '../useRoute';

interface EditRouteProps {
    route: Route;
    onClose: () => void;
    responseTimeoutSeconds?: number;
}

export const EditRoute = ({ route, onClose, responseTimeoutSeconds }: EditRouteProps) => {
    const { saveRoute, isSaving, error } = useSaveRoute({
        onSuccess: () => {
            onClose();
        },
    });

    const handleSubmit = (data: RouteFormValues) => {
        saveRoute({ id: route.id, responseTimeoutSeconds, ...data });
    };

    return (
        <RouteForm
            onClose={onClose}
            onSubmit={handleSubmit}
            isLoading={isSaving}
            error={error}
            initialUrl={route.url}
            tokenReentryRequired={!!route.auth}
            tokenConfigured={hasRouteToken(route)}
            modalTitle={responseTimeoutSeconds === undefined ? i18n.t('Edit route') : i18n.t('Increase response timeout to {{timeout}} seconds', { timeout: responseTimeoutSeconds })}
            submitButtonText={i18n.t('Save')}
        />
    );
};
