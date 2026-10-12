import i18n from '@dhis2/d2-i18n';
import { NoticeBox, Button } from '@dhis2/ui';
import { SystemService } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import { Loading } from '../components/StateViews';

export const HomePage = () => {
    const connection = useQuery({ queryKey: ['chapHealth'], queryFn: () => SystemService.healthHealthGet() });
    return (
        <>
            <PageHeader title={i18n.t('Early Warning')} />
            {connection.isLoading ? <Loading /> : connection.isError ? (
                <NoticeBox error title={i18n.t('Cannot connect to CHAP')}>
                    <p>{i18n.t('Check the CHAP route in the Modeling App settings and your access to it.')}</p>
                    <Button onClick={() => connection.refetch()}>{i18n.t('Retry')}</Button>
                </NoticeBox>
            ) : (
                <NoticeBox valid title={i18n.t('Connected to CHAP')}>
                    {i18n.t('The Early Warning App uses the CHAP connection configured in the Modeling App.')}
                </NoticeBox>
            )}
        </>
    );
};
