import i18n from '@dhis2/d2-i18n';
import { Button, IconArrowLeft16 } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { NewPredictionContent } from '../../components/PageContent/NewPrediction';
import styles from './NewPredictionPage.module.css';

export const NewPredictionPage = () => {
    const navigate = useNavigate();

    return (
        <div>
            <PageHeader
                pageTitle={i18n.t('New prediction')}
                pageDescription={i18n.t('Create a new prediction to forecast outcomes using a model')}
            />

            <Button
                className={styles.backButton}
                small
                icon={<IconArrowLeft16 />}
                onClick={() => navigate('/predictions')}
            >
                {i18n.t('Back to predictions')}
            </Button>

            <NewPredictionContent />
        </div>
    );
};
