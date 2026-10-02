import i18n from '@dhis2/d2-i18n';
import { Tab, TabBar } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/features/common-features/PageHeader/PageHeader';
import { AlertPoliciesTable } from '@/components/BackendAlerts/AlertPoliciesTable';
import { RecordedAlertsTable } from '@/components/BackendAlerts/RecordedAlertsTable';
import styles from './AlertsPage.module.css';

export const AlertsPage = ({ policies = false }: { policies?: boolean }) => {
    const navigate = useNavigate();
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Alerts')}
                pageDescription={i18n.t('Review recorded alerts and manage the policies prediction setups use to raise them.')}
            />
            <TabBar>
                <Tab selected={!policies} onClick={() => navigate('/alerts')}>
                    {i18n.t('Recorded alerts')}
                </Tab>
                <Tab selected={policies} onClick={() => navigate('/alerts/policies')}>
                    {i18n.t('Policies')}
                </Tab>
            </TabBar>
            <div className={styles.content}>
                {policies ? <AlertPoliciesTable /> : <RecordedAlertsTable />}
            </div>
        </>
    );
};
