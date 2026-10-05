import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, IconAdd16, Tab, TabBar } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/features/common-features/PageHeader/PageHeader';
import { AlertPoliciesTable } from '@/components/BackendAlerts/AlertPoliciesTable';
import { CreateAlertPolicyModal } from '@/components/BackendAlerts/CreateAlertPolicyModal';
import { RecordedAlertsTable } from '@/components/BackendAlerts/RecordedAlertsTable';
import styles from './AlertsPage.module.css';

export const AlertsPage = ({ policies = false }: { policies?: boolean }) => {
    const navigate = useNavigate();
    const [creating, setCreating] = useState(false);
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Alerts')}
                pageDescription={i18n.t('Review recorded alerts and manage the policies prediction setups use to raise them.')}
            />
            <div className={styles.tabs}>
                <TabBar>
                    <Tab selected={!policies} onClick={() => navigate('/alerts')}>
                        {i18n.t('Recorded alerts')}
                    </Tab>
                    <Tab selected={policies} onClick={() => navigate('/alerts/policies')}>
                        {i18n.t('Policies')}
                    </Tab>
                </TabBar>
                {policies && (
                    <Button primary small icon={<IconAdd16 />} onClick={() => setCreating(true)}>
                        {i18n.t('New policy')}
                    </Button>
                )}
            </div>
            <div className={styles.content}>
                {policies ? <AlertPoliciesTable /> : <RecordedAlertsTable />}
            </div>
            {creating && <CreateAlertPolicyModal onClose={() => setCreating(false)} />}
        </>
    );
};
