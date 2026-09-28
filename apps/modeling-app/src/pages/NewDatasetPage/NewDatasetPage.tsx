import i18n from '@dhis2/d2-i18n';
import { Button, IconArrowLeft16 } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { NewDatasetForm } from '../../components/NewDatasetForm';
import styles from './NewDatasetPage.module.css';

export const NewDatasetPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div>
            <PageHeader
                pageTitle={i18n.t('New dataset')}
                pageDescription={i18n.t('Choose the data to import and name its columns so models can use them.')}
            />

            <Button
                className={styles.backButton}
                small
                icon={<IconArrowLeft16 />}
                onClick={() => navigate('/datasets')}
            >
                {i18n.t('Back to datasets')}
            </Button>

            <NewDatasetForm />
        </div>
    );
};
