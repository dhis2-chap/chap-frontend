import React, { useState } from 'react';
import styles from './PredictionResultWidget.module.css';
import i18n from '@dhis2/d2-i18n';
import { TabBar, Tab, Menu, MenuItem } from '@dhis2/ui';
import {
    UncertaintyAreaChart,
    PredictionTable,
    PredictionOrgUnitSeries,
    PredictionMap,
} from '@dhis2-chap/ui';

type Props = {
    series: PredictionOrgUnitSeries[];
    predictionTargetName: string;
    selectedOrgUnitId: string | undefined;
    selectedTab: 'chart' | 'table' | 'map';
    onSelectOrgUnit: (orgUnitId: string) => void;
    onSelectTab: (tab: 'chart' | 'table' | 'map') => void;
};

export const PredictionResultWidgetComponent = ({
    series,
    predictionTargetName,
    selectedOrgUnitId,
    selectedTab,
    onSelectOrgUnit,
    onSelectTab,
}: Props) => {
    const selectedSeries = series.find(s => s.orgUnitId === selectedOrgUnitId) ?? series[0];

    return (
        <div className={styles.card}>
            <TabBar className={styles.tabBar}>
                <Tab
                    selected={selectedTab === 'chart'}
                    onClick={() => onSelectTab('chart')}
                >
                    {i18n.t('Chart')}
                </Tab>
                <Tab
                    selected={selectedTab === 'table'}
                    onClick={() => onSelectTab('table')}
                >
                    {i18n.t('Table')}
                </Tab>
                <Tab
                    selected={selectedTab === 'map'}
                    onClick={() => onSelectTab('map')}
                >
                    {i18n.t('Map')}
                </Tab>
            </TabBar>
            <div className={styles.container}>
                <div className={styles.menu}>
                    <Menu dense>
                        {series.map(s => (
                            <MenuItem
                                active={selectedTab !== 'map' && selectedSeries?.orgUnitId === s.orgUnitId}
                                disabled={selectedTab === 'map'}
                                key={s.orgUnitId}
                                label={s.orgUnitName}
                                onClick={() => onSelectOrgUnit(s.orgUnitId)}
                            />
                        ))}
                    </Menu>
                </div>

                {selectedTab === 'chart' && selectedSeries && (
                    <div className={styles.content}>
                        <UncertaintyAreaChart
                            predictionTargetName={predictionTargetName}
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
                {selectedTab === 'map' && (
                    <div className={styles.content}>
                        <PredictionMap
                            series={series}
                            predictionTargetName={predictionTargetName}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

