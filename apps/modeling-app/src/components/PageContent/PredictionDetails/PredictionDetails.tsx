import React, { useMemo, useState } from 'react';
import styles from './PredictionDetails.module.css';
import i18n from '@dhis2/d2-i18n';
import { TabBar, Tab, Menu, MenuItem } from '@dhis2/ui';
import {
    Card,
    FullPredictionResponseExtended,
    PredictionResponseExtended,
    PredictionRead,
    PredictionTable,
    UncertaintyAreaChart,
} from '@dhis2-chap/ui';
import { useDataItemById } from '../../../hooks/useDataItemById';
import { OrganisationUnit } from '../../OrganisationUnitSelector/OrganisationUnitSelector';

type Props = {
    prediction: PredictionRead;
    orgUnits: Map<string, OrganisationUnit>;
};

const quantiles = [
    { q: 0.1, name: 'quantile_low' },
    { q: 0.5, name: 'median' },
    { q: 0.9, name: 'quantile_high' },
];

const getQuantile = (quantile: number, values: number[] | undefined) => {
    if (!values) return 0;
    const sortedArr = [...values].sort((a, b) => a - b);
    const n = sortedArr.length;
    const index = quantile * (n - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    if (lowerIndex === upperIndex) {
        return Math.round(sortedArr[lowerIndex]);
    }
    return Math.round(
        sortedArr[lowerIndex]
        + (sortedArr[upperIndex] - sortedArr[lowerIndex])
        * (index - lowerIndex),
    );
};

export const PredictionDetails = ({
    prediction,
    orgUnits,
}: Props) => {
    const [selectedTab, setSelectedTab] = useState<'chart' | 'table'>('chart');
    const [indexOfSelectedOrgUnit, setIndexOfSelectedOrgUnit] = useState(0);

    const predictionTargetId: string = prediction.metaData?.dataItemMapper?.find(
        (m: { featureName: string }) => m.featureName === 'disease_cases',
    )?.dataItemId;

    const { dataItem, isLoading: isDataItemLoading } = useDataItemById(predictionTargetId);

    const toFullPredictionResponse = useMemo((): FullPredictionResponseExtended => {
        return {
            diseaseId: predictionTargetId,
            dataValues: prediction.forecasts.flatMap(forecast =>
                quantiles.map(quantile => ({
                    orgUnit: forecast.orgUnit,
                    value: getQuantile(quantile.q, forecast.values),
                    displayName: orgUnits.get(forecast.orgUnit)?.displayName ?? forecast.orgUnit,
                    dataElement: quantile.name,
                    period: forecast.period,
                })),
            ),
        };
    }, [prediction, predictionTargetId, orgUnits]);

    const matrix: PredictionResponseExtended[][] = useMemo(() => {
        const groups = new Map<string, PredictionResponseExtended[]>();
        for (const item of toFullPredictionResponse.dataValues) {
            const group = groups.get(item.orgUnit);
            if (group) {
                group.push(item);
            } else {
                groups.set(item.orgUnit, [item]);
            }
        }

        return Array
            .from(groups.values())
            .sort((a, b) => a[0].displayName.localeCompare(b[0].displayName));
    }, [toFullPredictionResponse]);

    if (isDataItemLoading) {
        return <p>{i18n.t('Loading prediction...')}</p>;
    }

    if (!toFullPredictionResponse) {
        return <p>{i18n.t('Prediction not found')}</p>;
    }

    return (
        <>
            <Card className={styles.card}>
                <TabBar className={styles.tabBar}>
                    <Tab
                        selected={selectedTab === 'chart'}
                        onClick={() => setSelectedTab('chart')}
                    >
                        {i18n.t('Chart')}
                    </Tab>
                    <Tab
                        selected={selectedTab === 'table'}
                        onClick={() => setSelectedTab('table')}
                    >
                        {i18n.t('Table')}
                    </Tab>
                </TabBar>
                <div className={styles.container}>
                    <div className={styles.menu}>
                        <Menu dense>
                            {matrix.map((orgUnitData, index) => (
                                <MenuItem
                                    active={indexOfSelectedOrgUnit === index}
                                    key={index}
                                    label={orgUnitData[0].displayName}
                                    onClick={() => setIndexOfSelectedOrgUnit(index)}
                                />
                            ))}
                        </Menu>
                    </div>

                    {selectedTab === 'chart' && (
                        <div className={styles.content}>
                            <UncertaintyAreaChart
                                predictionTargetName={dataItem?.displayName ?? predictionTargetId}
                                data={matrix[indexOfSelectedOrgUnit] ?? []}
                            />
                        </div>
                    )}
                    {selectedTab === 'table' && (
                        <div className={styles.content}>
                            <PredictionTable
                                data={matrix[indexOfSelectedOrgUnit]}
                            />
                        </div>
                    )}
                </div>
            </Card>
        </>
    );
};
