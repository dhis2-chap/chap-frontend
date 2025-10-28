import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { useNavigate } from 'react-router-dom';
import { Button, IconArrowLeft16 } from '@dhis2/ui';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { PredictionDetails } from '../../components/PageContent/PredictionDetails';

export const PredictionDetailsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Prediction details')}
                pageDescription={i18n.t('View the details of a prediction.')}
            />

            <div>
                <Button
                    small
                    icon={<IconArrowLeft16 />}
                    onClick={() => navigate('/predictions')}
                >
                    {i18n.t('Back to predictions')}
                </Button>
            </div>

            <PredictionDetails />
        </>
    );
};
