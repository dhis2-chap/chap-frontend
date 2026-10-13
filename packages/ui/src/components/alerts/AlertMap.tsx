import { useContext, useEffect, useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { canonicalizePeriodId } from '@dhis2-chap/core';
import MapItem, { MapContext } from '../maps/MapItem';
import Basemap from '../maps/Basemap';
import type { FeatureCollection } from '../maps/utils';
import styles from './AlertMap.module.css';

type AlertMapProps = {
    orgUnits: FeatureCollection;
    periods: { id: string; label: string }[];
    alerts: { orgUnit: string; period: string; level: string }[];
    levels: { name: string; color: string }[];
};
type MapLayerApi = {
    createLayer: (config: unknown) => unknown;
    addLayer: (layer: unknown) => void;
    removeLayer: (layer: unknown) => void;
    getLayersBounds: () => unknown;
    fitBounds: (bounds: unknown) => void;
};

const AlertLayer = ({ orgUnits, alerts, levels, period }: Omit<AlertMapProps, 'periods'> & { period: string }) => {
    const map = useContext(MapContext) as MapLayerApi;
    const features = useMemo(() => orgUnits.features.map((feature) => {
        const alert = alerts.find(item => item.orgUnit === feature.id && canonicalizePeriodId(item.period) === canonicalizePeriodId(period));
        return {
            ...feature,
            properties: {
                ...feature.properties,
                level: alert?.level ?? i18n.t('No alert'),
                color: levels.find(level => level.name === alert?.level)?.color ?? '#e0e0e0',
            },
        };
    }), [orgUnits, alerts, levels, period]);
    useEffect(() => {
        const layer = map.createLayer({ type: 'choropleth', data: features, opacity: 0.8, hoverLabel: '{name} ({level})' });
        map.addLayer(layer);
        map.fitBounds(map.getLayersBounds());
        return () => map.removeLayer(layer);
    }, [map, features]);
    return null;
};

export const AlertMap = ({ orgUnits, periods, alerts, levels }: AlertMapProps) => (
    <>
        <div className={styles.maps}>
            {periods.map(period => (
                <section key={period.id} className={styles.card}>
                    <h3>{period.label}</h3>
                    <div className={styles.viewport}>
                        <MapItem syncId="early-warning-alerts">
                            <Basemap />
                            <AlertLayer orgUnits={orgUnits} alerts={alerts} levels={levels} period={period.id} />
                        </MapItem>
                    </div>
                </section>
            ))}
        </div>
        <ul className={styles.legend} aria-label={i18n.t('Alert levels')}>
            {[{ name: i18n.t('No alert'), color: '#e0e0e0' }, ...levels].map(level => (
                <li key={level.name}>
                    <span className={styles.swatch} style={{ backgroundColor: level.color }} />
                    {level.name}
                </li>
            ))}
        </ul>
    </>
);
