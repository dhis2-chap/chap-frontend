import i18n from '@dhis2/d2-i18n'
import Highcharts from 'highcharts'
import accessibility from 'highcharts/modules/accessibility'
import highchartsMore from 'highcharts/highcharts-more'
import exporting from 'highcharts/modules/exporting'
import React, { useState } from 'react'
import HighchartsReact from 'highcharts-react-official'
import styles from './UncertaintyAreaChart.module.css'
import { Menu, MenuItem } from '@dhis2/ui'
import { FullPredictionResponseExtended } from '../../../interfaces/Prediction'
import { createFixedPeriodFromPeriodId } from '@dhis2/multi-calendar-dates'

accessibility(Highcharts)
exporting(Highcharts)
highchartsMore(Highcharts)

const getChartOptions = (
    data: any,
    predictionTargetName: string
): Highcharts.Options => {
    const median = data
        .filter((d: any) => d.dataElement === 'median')
        .map((d: any) => [d.period, d.value])

    const range = data
        .filter((d: any) => d.dataElement === 'quantile_low')
        .map((d: any) => [
            d.period,
            d.value,
            data.filter(
                (x: any) =>
                    x.dataElement === 'quantile_high' && x.period === d.period
            )[0].value,
        ])

    return {
        title: {
            text: i18n.t(
                'Prediction for {{predictionTargetName}} for {{orgUnitName}}',
                {
                    predictionTargetName,
                    orgUnitName: data[0].displayName,
                }
            ),
        },
        tooltip: {
            shared: true,
        },
        xAxis: {
            type: 'category',
            labels: {
                enabled: true,
                formatter: function () {
                    return createFixedPeriodFromPeriodId({
                        periodId: this.value.toString(),
                        calendar: 'gregory',
                    }).displayName
                },
                style: {
                    fontSize: '0.9rem',
                },
            },
        },
        yAxis: {
            title: {
                text: 'Number of cases',
            },
        },
        credits: {
            text: 'CHAP',
        },
        chart: {
            height: 490,
            marginBottom: 125,
        },
        plotOptions: {
            series: {
                lineWidth: 5,
            },
        },
        series: [
            //median
            {
                type: 'line',
                data: median,
                name: i18n.t('Quantile median'),
                color: '#004bbd',
                zIndex: 2,
            },
            //high
            {
                type: 'arearange',
                name: i18n.t('Range'),
                data: range,
                zIndex: 1,
                lineWidth: 0,
                color: '#004bbd',
                fillOpacity: 0.4,
            },
        ],
    }
}

interface PredicationChartProps {
    data: FullPredictionResponseExtended
    predictionTargetName: string
}

function groupByOrgUnit(data: any) {
    const orgUnits = [...new Set(data.map((item: any) => item.orgUnit))]
    return orgUnits.map((orgUnit) =>
        data.filter((item: any) => item.orgUnit === orgUnit)
    )
}

export const UncertaintyAreaChart = ({
    data,
    predictionTargetName,
}: PredicationChartProps) => {
    const matrix = groupByOrgUnit(data.dataValues)

    const [options, setOptions] = useState<Highcharts.Options | undefined>(
        getChartOptions(matrix[0], predictionTargetName)
    )
    const [indexOfSelectedOrgUnit, setIndexOfSelectedOrgUnit] = useState(0)

    const onSelectOrgUnit = (index: number) => {
        setIndexOfSelectedOrgUnit(index)
        setOptions(getChartOptions(matrix[index], predictionTargetName))
    }

    return (
        <>
            <div className={styles.chartContainer}>
                <div>
                    <Menu dense>
                        {matrix.map((orgUnitData: any, index: number) => (
                            <MenuItem
                                className={styles.menu}
                                active={indexOfSelectedOrgUnit == index}
                                key={index}
                                label={orgUnitData[0].displayName}
                                onClick={() => onSelectOrgUnit(index)}
                            />
                        ))}
                    </Menu>
                </div>
                <div className={styles.chart}>
                    <HighchartsReact
                        highcharts={Highcharts}
                        constructorType={'chart'}
                        options={options}
                    />
                </div>
            </div>
        </>
    )
}
