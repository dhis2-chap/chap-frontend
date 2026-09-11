import i18n from '@dhis2/d2-i18n';
import { useSaveRoute } from '../hooks/useSaveRoute';
import { RouteForm, RouteFormValues } from '../RouteForm';
import { hasRouteToken } from '../../../../components/ApiTokenField/routeToken';
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
        saveRoute({ id: route.id, ...data });
    };

    return (
        <RouteForm
            onClose={onClose}
            onSubmit={handleSubmit}
            isLoading={isSaving}
            initialUrl={route.url}
            tokenConfigured={hasRouteToken(route.headers)}
            modalTitle={i18n.t('Edit route')}
            submitButtonText={i18n.t('Save')}
        />
    );
};
