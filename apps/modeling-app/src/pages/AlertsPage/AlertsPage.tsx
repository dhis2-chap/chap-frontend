import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '@/features/common-features/PageHeader/PageHeader';
import { AlertPoliciesTable } from '@/components/BackendAlerts/AlertPoliciesTable';
import { CreateAlertPolicyModal } from '@/components/BackendAlerts/CreateAlertPolicyModal';

export const AlertsPage = () => {
    const [creating, setCreating] = useState(false);
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Alert policies')}
                pageDescription={i18n.t('Manage the policies prediction setups use to raise alerts.')}
                setDrawerOpen={setCreating}
                setDrawerOpenText={i18n.t('New policy')}
            />
            <AlertPoliciesTable />
            {creating && <CreateAlertPolicyModal onClose={() => setCreating(false)} />}
        </>
    );
};
