import i18n from '@dhis2/d2-i18n';
import { Button, IconArrowLeft16 } from '@dhis2/ui';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import styles from './NewEvaluationPage.module.css';
import { DatasetEvaluationForm } from '@/components/NewEvaluationForm/DatasetEvaluationForm';

export const NewEvaluationPage = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/evaluate';
    const datasetId = searchParams.get('datasetId') ?? undefined;
    const isFromDetails = returnTo.startsWith('/evaluate/') && returnTo !== '/evaluate';

    return (
        <div>
            <PageHeader
                pageTitle={i18n.t('New evaluation')}
                pageDescription={i18n.t('Create a new evaluation to assess the performance of a model')}
            />

            <Button
                className={styles.backButton}
                small
                icon={<IconArrowLeft16 />}
                onClick={() => navigate(returnTo)}
            >
                {isFromDetails ? i18n.t('Back to evaluation details') : i18n.t('Back to evaluations')}
            </Button>

            {/* A link to another dataset starts a fresh form. */}
            <DatasetEvaluationForm key={datasetId} initialDatasetId={datasetId} initialValues={state} />
        </div>
    );
};
