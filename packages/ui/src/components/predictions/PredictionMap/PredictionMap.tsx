import React from 'react'
import i18n from '@dhis2/d2-i18n'
import { FullPredictionResponseExtended } from '../../../interfaces/Prediction'
import {
    getUniqeOrgUnits,
    getUniqePeriods,
} from '../../../utils/PredictionResponse'
import MapItem from '../../maps/MapItem'
import Choropleth from '../../maps/Choropleth'
import Legend from '../../maps/Legend'
import Basemap from '../../maps/Basemap'
import { getEqualIntervals } from '../../maps/utils'
import useOrgUnits from '../../../hooks/useOrgUnits'
import styles from './PredictionMap.module.css'
import { createFixedPeriodFromPeriodId } from '@dhis2/multi-calendar-dates'

interface PredictionMapProps {
    data: FullPredictionResponseExtended
    predictionTargetName: string
}

const colors = ['#FFFFD4', '#FED98E', '#FE9929', '#D95F0E', '#993404']

export const PredictionMap = ({
    data,
    predictionTargetName,
}: PredictionMapProps) => {
    // get all orgunits
    const orgUnitIds: any = getUniqeOrgUnits(data.dataValues)

    // load orgunit geoms
    const { orgUnits } = useOrgUnits(orgUnitIds)

    // get and classify periods
    const periods = getUniqePeriods(data.dataValues)
    const values = data.dataValues.map((d) => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const bins = getEqualIntervals(minValue, maxValue)

    return orgUnits ? (
        <div>
            <h3>Prediction Maps for {predictionTargetName}</h3>
            <div className={styles.predictionMapGroup}>
                {periods.map((period: string, index: number) => {
                    return (
                        <div className={styles.predictionMapCard} key={index}>
                            <h4>
                                {i18n.t(
                                    createFixedPeriodFromPeriodId({
                                        periodId: period,
                                        calendar: 'gregory',
                                    }).displayName
                                )}
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
                                    prediction={data}
                                    geojson={orgUnits}
                                    bins={bins}
                                    colors={colors}
                                />
                            </MapItem>
                        </div>
                    )
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
    ) : null
}
