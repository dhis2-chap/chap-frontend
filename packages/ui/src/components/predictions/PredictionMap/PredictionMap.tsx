import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { PredictionOrgUnitSeries } from '../../../interfaces/Prediction';
import MapItem from '../../maps/MapItem';
import Choropleth from '../../maps/Choropleth';
import Legend from '../../maps/Legend';
import Basemap from '../../maps/Basemap';
import { getEqualIntervals, FeatureCollection } from '../../maps/utils';
import styles from './PredictionMap.module.css';

interface PredictionMapProps {
    series: PredictionOrgUnitSeries[];
    predictionTargetName: string;
    orgUnits: FeatureCollection;
}

const colors = ['#FFFFD4', '#FED98E', '#FE9929', '#D95F0E', '#993404'];

export const PredictionMap = ({ series, predictionTargetName, orgUnits }: PredictionMapProps) => {
    // collect periods and labels
    const periodToLabel = new Map<string, string>();
    for (const s of series) {
        for (const p of s.points) {
            if (!periodToLabel.has(p.period)) {
                periodToLabel.set(p.period, p.periodLabel);
            }
        }
    }
    const periods = Array.from(periodToLabel.keys());

    const allMedianValues: number[] = series.flatMap(s => s.points.map(p => p.quantiles.median));
    const minValue = Math.min(...allMedianValues);
    const maxValue = Math.max(...allMedianValues);
    const bins = getEqualIntervals(minValue, maxValue);

    const adaptedPrediction = {
        dataValues: series.flatMap(s => s.points.map(p => ({
            orgUnit: s.orgUnitId,
            period: p.period,
            dataElement: 'median',
            value: p.quantiles.median,
        }))),
    };

    return (
        <div>
            <div className={styles.predictionMapGroup}>
                {periods.map((period: string, index: number) => {
                    return (
                        <div className={styles.predictionMapCard} key={index}>
                            <h4>
                                {periodToLabel.get(period) || period}
                            </h4>
                            <MapItem
                                key={period}
                                index={index}
                                count={periods.length}
                                syncId="prediction-map"
                            >
                                <Basemap />
                                <Choropleth
                                    period={period}
                                    prediction={adaptedPrediction}
                                    geojson={orgUnits}
                                    bins={bins}
                                    colors={colors}
                                />
                            </MapItem>
                        </div>
                    );
                })}
            </div>
            <Legend
                title={i18n.t('Median Prediction for {{predictionTargetName}}', {
                    predictionTargetName,
                })}
                bins={bins}
                colors={colors}
            />
        </div>
    );
};
