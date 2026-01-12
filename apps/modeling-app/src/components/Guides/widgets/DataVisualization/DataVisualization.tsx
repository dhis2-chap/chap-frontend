/**
 * MOCK IMPLEMENTATION - For documentation/guides only.
 * This component displays a static example chart for illustrative purposes.
 * Do NOT use this component in the actual application.
 */
import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import styles from './DataVisualization.module.css';

interface DataPoint {
    [key: string]: string | number;
}

interface DataVisualizationProps {
    type?: 'line' | 'bar' | 'area';
    title?: string;
    data: DataPoint[];
}

export const DataVisualization = ({
    type = 'line',
    title = 'Chart',
    data,
}: DataVisualizationProps) => {
    if (!data || data.length === 0) {
        return (
            <div className={styles.noData}>No data available for visualization</div>
        );
    }

    const keys = Object.keys(data[0]);
    const categoryKey = keys[0];
    const valueKey = keys[1];

    const categories = data.map(d => String(d[categoryKey]));
    const values = data.map(d => Number(d[valueKey]));

    const chartType = type === 'bar' ? 'column' : type;

    const options: Highcharts.Options = {
        chart: {
            type: chartType,
            height: 300,
        },
        title: {
            text: title,
        },
        xAxis: {
            categories,
            title: {
                text: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
            },
        },
        yAxis: {
            title: {
                text: valueKey.charAt(0).toUpperCase() + valueKey.slice(1),
            },
        },
        series: [
            {
                type: chartType,
                name: valueKey.charAt(0).toUpperCase() + valueKey.slice(1),
                data: values,
                color: '#1976d2',
            },
        ],
        credits: {
            enabled: false,
        },
        legend: {
            enabled: false,
        },
    };

    return (
        <div className={styles.container}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};
