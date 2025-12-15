import React from 'react';
import { CircularLoader } from '@dhis2/ui';
import { PredictionOrgUnitSeries, PredictionMap } from '@dhis2-chap/ui';
import { useOrgUnitGeometry } from '../../../../../hooks/useOrgUnitGeometry';

type Props = {
    series: PredictionOrgUnitSeries[];
    predictionTargetName: string;
};

export const PredictionMapWrapper = ({ series, predictionTargetName }: Props) => {
    const orgUnitIds = Array.from(new Set(series.map(s => s.orgUnitId)));
    const { orgUnits, loading, error } = useOrgUnitGeometry(orgUnitIds);

    if (loading) {
        return <CircularLoader />;
    }

    if (error || !orgUnits) {
        return null;
    }

    return (
        <PredictionMap
            series={series}
            predictionTargetName={predictionTargetName}
            orgUnits={orgUnits}
        />
    );
};
