interface Interval {
    startValue: number;
    endValue: number;
}

export const getEqualIntervals = (minValue: number, maxValue: number, numClasses: number = 5): Interval[] => {
    const bins: Interval[] = [];
    const binSize = (maxValue - minValue) / numClasses;

    for (let i = 0; i < numClasses; i++) {
        const startValue = minValue + i * binSize;
        const endValue = i < numClasses - 1 ? startValue + binSize : maxValue;

        bins.push({
            startValue: Math.round(startValue),
            endValue: Math.round(endValue),
        });
    }

    return bins;
};

interface OrgUnit {
    id: string;
    na: string;
    ty: number;
    co: string;
}

interface GeoFeature {
    type: 'Feature';
    id: string;
    properties: {
        name: string;
    };
    geometry: {
        type: 'Point' | 'Polygon' | 'MultiPolygon';
        coordinates: any;
    };
}

export interface FeatureCollection {
    type: 'FeatureCollections';
    features: GeoFeature[];
}

export const parseOrgUnits = (orgUnits: OrgUnit[]): FeatureCollection => {
    return {
        type: 'FeatureCollections',
        features: orgUnits.map((ou) => {
            // get geotype
            let type: 'Point' | 'Polygon' | 'MultiPolygon' = 'Point';
            if (ou.ty === 2) {
                type = 'Polygon';
                if (ou.co.substring(0, 4) === '[[[[') {
                    type = 'MultiPolygon';
                }
            }
            const geom = { type, coordinates: JSON.parse(ou.co) };
            return {
                type: 'Feature',
                id: ou.id,
                properties: { name: ou.na },
                geometry: geom,
            };
        }),
    };
};
