import i18n from '@dhis2/d2-i18n';
import { Button, IconArrowLeft16 } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { ConfiguredModelDashboard } from '../../components/PageContent/ConfiguredModelDashboard';
import styles from './ConfiguredModelDashboardPage.module.css';

export const ConfiguredModelDashboardPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Prediction dashboard')}
                pageDescription={i18n.t('Manage and run predictions for a certain model and configuration.')}
            />
            <Button
                className={styles.backButton}
                small
                icon={<IconArrowLeft16 />}
                onClick={() => navigate('/predictions')}
            >
                {i18n.t('Back to predictions')}
            </Button>
            <ConfiguredModelDashboard />
        </>
    );
};
