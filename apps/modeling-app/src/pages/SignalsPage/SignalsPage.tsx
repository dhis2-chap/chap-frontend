import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '@/features/common-features/PageHeader/PageHeader';
import { AlertPoliciesTable } from '@/components/BackendAlerts/AlertPoliciesTable';
import { CreateAlertPolicyModal } from '@/components/BackendAlerts/CreateAlertPolicyModal';

export const SignalsPage = () => {
    const [creating, setCreating] = useState(false);
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Signal policies')}
                pageDescription={i18n.t('Manage the policies used to raise signals from forecasts.')}
                setDrawerOpen={setCreating}
                setDrawerOpenText={i18n.t('New policy')}
            />
            <AlertPoliciesTable />
            {creating && <CreateAlertPolicyModal onClose={() => setCreating(false)} />}
        </>
    );
};
