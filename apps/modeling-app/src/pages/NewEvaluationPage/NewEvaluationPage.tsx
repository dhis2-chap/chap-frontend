import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, IconArrowLeft16 } from '@dhis2/ui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import styles from './NewEvaluationPage.module.css';
import { NewEvaluationForm } from '@/components/NewEvaluationForm';

export const NewEvaluationPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/evaluate';
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
                {i18n.t(isFromDetails ? 'Back to evaluation details' : 'Back to evaluations')}
            </Button>

            <NewEvaluationForm />
        </div>
    );
};
