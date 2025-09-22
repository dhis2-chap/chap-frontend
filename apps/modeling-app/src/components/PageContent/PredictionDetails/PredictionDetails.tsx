import React, { useMemo, useState } from 'react';
import styles from './PredictionDetails.module.css';
import i18n from '@dhis2/d2-i18n';
import { TabBar, Tab, Menu, MenuItem, CircularLoader } from '@dhis2/ui';
import {
    Card,
    PredictionRead,
    PredictionTable,
    UncertaintyAreaChart,
    buildPredictionSeries,
    PredictionOrgUnitSeries,
} from '@dhis2-chap/ui';
import { useDataItemById } from '../../../hooks/useDataItemById';

type Props = {
    prediction: PredictionRead;
    orgUnits: Map<string, { id: string; displayName: string }>;
};

export const PredictionDetails = ({
    prediction,
    orgUnits,
}: Props) => {
    const [selectedTab, setSelectedTab] = useState<'chart' | 'table'>('chart');
    const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string | undefined>(undefined);

    const predictionTargetId: string = prediction.metaData?.dataItemMapper?.find(
        (m: { featureName: string }) => m.featureName === 'disease_cases',
    )?.dataItemId;

    const { dataItem, isLoading: isDataItemLoading } = useDataItemById(predictionTargetId);

    const series: PredictionOrgUnitSeries[] = useMemo(() => {
        const map: Map<string, { id: string; displayName: string }> = new Map();
        orgUnits.forEach((val, key) => map.set(key, { id: val.id, displayName: val.displayName }));
        return buildPredictionSeries(prediction, map, predictionTargetId);
    }, [prediction, orgUnits, predictionTargetId]);

    const selectedSeries: PredictionOrgUnitSeries | undefined = useMemo(() => {
        if (!series.length) return undefined;
        if (selectedOrgUnitId) return series.find(s => s.orgUnitId === selectedOrgUnitId);
        return series[0];
    }, [series, selectedOrgUnitId]);

    if (isDataItemLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (!series || series.length === 0) {
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
                            {series.map(s => (
                                <MenuItem
                                    active={selectedSeries?.orgUnitId === s.orgUnitId}
                                    key={s.orgUnitId}
                                    label={s.orgUnitName}
                                    onClick={() => setSelectedOrgUnitId(s.orgUnitId)}
                                />
                            ))}
                        </Menu>
                    </div>

                    {selectedTab === 'chart' && selectedSeries && (
                        <div className={styles.content}>
                            <UncertaintyAreaChart
                                predictionTargetName={dataItem?.displayName ?? predictionTargetId}
                                series={selectedSeries}
                            />
                        </div>
                    )}
                    {selectedTab === 'table' && selectedSeries && (
                        <div className={styles.content}>
                            <PredictionTable
                                series={selectedSeries}
                            />
                        </div>
                    )}
                </div>
            </Card>
        </>
    );
};
