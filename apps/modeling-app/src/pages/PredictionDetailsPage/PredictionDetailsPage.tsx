import React, { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { useNavigate, useParams } from 'react-router-dom';
import useOrgUnits from '../../hooks/useOrgUnits';
import { PredictionDetails } from '../../components/PageContent/PredictionDetails';
import usePredictionById from '../../components/PageContent/PredictionDetails/hooks/usePredictionById';
import { Button, IconArrowLeft16 } from '@dhis2/ui';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';

export const PredictionDetailsPage: React.FC = () => {
    const navigate = useNavigate();
    const { predictionId } = useParams<{ predictionId: string }>();
    const { prediction, isLoading } = usePredictionById(predictionId);
    const { orgUnits } = useOrgUnits();

    const orgUnitMap = useMemo(() => new Map(
        orgUnits
            ?.organisationUnits
            ?.map(ou => [ou.id, ou]),
    ), [orgUnits]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!prediction || !orgUnitMap) {
        return <div>Prediction not found</div>;
    }

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Prediction details{{escaped}} {{name}}', {
                    name: prediction.name,
                    escaped: ':',
                })}
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

            <PredictionDetails
                prediction={prediction}
                orgUnits={orgUnitMap}
            />
        </>
    );
};
