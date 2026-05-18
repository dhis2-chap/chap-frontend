import i18n from '@dhis2/d2-i18n';
import { Button, IconArrowLeft16 } from '@dhis2/ui';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { NewPredictionContent } from '../../components/PageContent/NewPrediction';
import styles from './NewPredictionPage.module.css';

export const NewPredictionPage = () => {
    const navigate = useNavigate();
    const { configuredId } = useParams();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo') || (configuredId ? `/predictions/${configuredId}` : '/predictions');

    return (
        <div>
            <PageHeader
                pageTitle={i18n.t('Run prediction')}
                pageDescription={i18n.t('Create a prediction run for this setup.')}
            />

            <Button
                className={styles.backButton}
                small
                icon={<IconArrowLeft16 />}
                onClick={() => navigate(returnTo)}
            >
                {i18n.t('Back to prediction setup')}
            </Button>

            <NewPredictionContent returnTo={returnTo} />
        </div>
    );
};
