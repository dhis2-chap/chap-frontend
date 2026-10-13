import i18n from '@dhis2/d2-i18n';
import { NoticeBox, Button } from '@dhis2/ui';
import { SystemService, useRoute } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { ErrorNotice, Loading } from '../components/StateViews';

export const HomePage = () => {
    const { route, isLoading: isRouteLoading, error: routeError } = useRoute();
    const connection = useQuery({
        queryKey: ['chapHealth'],
        queryFn: () => SystemService.healthHealthGet(),
        enabled: !!route,
    });

    const content = () => {
        if (isRouteLoading) return <Loading />;
        if (routeError) return <ErrorNotice error={routeError} />;
        if (!route) {
            return (
                <NoticeBox warning title={i18n.t('No CHAP route configured')}>
                    <p>{i18n.t('Add a route to your CHAP server to start using the Early Warning App.')}</p>
                    <Link to="/settings">{i18n.t('Go to settings')}</Link>
                </NoticeBox>
            );
        }
        if (connection.isLoading) return <Loading />;
        if (connection.isError) {
            return (
                <NoticeBox error title={i18n.t('Cannot connect to CHAP')}>
                    <p>{i18n.t('Check the CHAP route in settings and your access to it.')}</p>
                    <Button onClick={() => connection.refetch()}>{i18n.t('Retry')}</Button>
                </NoticeBox>
            );
        }
        return <NoticeBox valid title={i18n.t('Connected to CHAP')} />;
    };

    return (
        <>
            <PageHeader title={i18n.t('Early Warning')} />
            {content()}
        </>
    );
};
