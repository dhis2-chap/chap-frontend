import React from 'react';
import { useNavigate } from 'react-router-dom';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { EvaluationDetails } from '../../components/PageContent/EvaluationDetails';
import { Button, IconArrowLeft16 } from '@dhis2/ui';

export const EvaluationDetailsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Evaluation details')}
                pageDescription={i18n.t('Deep dive into a specific evaluation run and assess its performance and reliability.')}
            />
            <div>
                <Button
                    small
                    icon={<IconArrowLeft16 />}
                    onClick={() => {
                        navigate('/evaluate');
                    }}
                >
                    {i18n.t('Back to evaluations')}
                </Button>
            </div>

            <EvaluationDetails />
        </>
    );
};
