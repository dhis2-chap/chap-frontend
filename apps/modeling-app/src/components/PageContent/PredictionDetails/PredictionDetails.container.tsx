import React, { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { useParams } from 'react-router-dom';
import { PredictionDetailsComponent } from './PredictionDetails.component';
import usePredictionById from './hooks/usePredictionById';
import useOrgUnits from '../../../hooks/useOrgUnits';
import styles from './PredictionDetails.module.css';

export const PredictionDetails: React.FC = () => {
    const { predictionId } = useParams<{ predictionId: string }>();
    const { prediction, isLoading: isPredictionLoading, error: predictionError } = usePredictionById(predictionId);
    const { orgUnits, loading: isOrgUnitsLoading, error: orgUnitsError } = useOrgUnits();

    const isLoading = isPredictionLoading || isOrgUnitsLoading;
    const hasError = predictionError || orgUnitsError;

    const orgUnitMap = useMemo(() => new Map(
        orgUnits
            ?.organisationUnits
            ?.map(ou => [ou.id, ou]),
    ), [orgUnits]);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (hasError) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Error loading prediction')}>
                    {predictionError?.message || orgUnitsError?.message || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    if (!prediction) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Prediction not found')}>
                    {i18n.t('The prediction you are looking for does not exist or you do not have permission to access it.')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <PredictionDetailsComponent
            prediction={prediction}
            orgUnits={orgUnitMap}
        />
    );
};
