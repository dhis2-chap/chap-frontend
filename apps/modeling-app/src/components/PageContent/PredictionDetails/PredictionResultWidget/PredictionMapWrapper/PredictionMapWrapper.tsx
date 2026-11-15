import { CircularLoader } from '@dhis2/ui';
import { PredictionOrgUnitSeries } from '@chap-blocks/ui/utils';
import { PredictionMap } from '@chap-blocks/ui/maps';
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
            basemap={{
                url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>',
            }}
        />
    );
};
