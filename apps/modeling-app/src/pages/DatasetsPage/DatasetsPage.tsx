import i18n from '@dhis2/d2-i18n';
import { Button, IconAdd16 } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { DatasetsContent } from '../../components/PageContent/Datasets';
import styles from './DatasetsPage.module.css';

export const DatasetsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Datasets')}
                pageDescription={i18n.t('Import data once and reuse it across evaluations.')}
            />

            <Button
                className={styles.createButton}
                icon={<IconAdd16 />}
                primary
                onClick={() => navigate('/datasets/new')}
            >
                {i18n.t('Create dataset')}
            </Button>

            <DatasetsContent />
        </>
    );
};
