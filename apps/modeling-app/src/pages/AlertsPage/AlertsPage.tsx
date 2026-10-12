import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '@/features/common-features/PageHeader/PageHeader';
import { AlertPoliciesTable } from '@/components/BackendAlerts/AlertPoliciesTable';

export const AlertsPage = () => (
    <>
        <PageHeader
            pageTitle={i18n.t('Alert policies')}
            pageDescription={i18n.t('Manage policies for prediction setups. Review alerts in the Early Warning App.')}
        />
        <AlertPoliciesTable />
    </>
);
