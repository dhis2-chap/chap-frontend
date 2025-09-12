import { useContext, useEffect } from 'react';
import { MapContext } from './MapItem';

const Choropleth = ({
    period,
    prediction,
    geojson,
    dataElement = 'median',
    bins,
    colors,
}: any) => {
    const map: any = useContext(MapContext);

    useEffect(() => {
        if (Object.prototype.hasOwnProperty.call(geojson, 'features')) {
            const features = geojson.features.map((feature: any) => {
                const value = prediction.dataValues.find(
                    (d: any) =>
                        d.period === period &&
                        d.orgUnit === feature.id &&
                        d.dataElement === dataElement,
                )?.value;

                const binIndex = bins.findIndex(
                    (bin: any) =>
                        value >= bin.startValue && value <= bin.endValue,
                );

                const color = colors[binIndex];

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        value: value || 'No value',
                        color,
                    },
                };
            });

            const config = {
                type: 'choropleth',
                data: features,
                opacity: 0.8,
                hoverLabel: '{name} ({value})',
            };

            map.addLayer(map.createLayer(config));

            map.fitBounds(map.getLayersBounds());
        }
    }, [map, period, prediction, dataElement, geojson, bins]);

    return null;
};

export default Choropleth;
