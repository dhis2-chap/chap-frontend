import React, { useState } from 'react';
import styles from './PredictionResultWidget.module.css';
import i18n from '@dhis2/d2-i18n';
import { TabBar, Tab, Menu, MenuItem } from '@dhis2/ui';
import {
    UncertaintyAreaChart,
    PredictionTable,
    PredictionOrgUnitSeries,
    Widget,
} from '@dhis2-chap/ui';
import { PredictionMapWrapper } from './PredictionMapWrapper/PredictionMapWrapper';

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
    const [open, setOpen] = useState(true);
    const selectedSeries = series.find(s => s.orgUnitId === selectedOrgUnitId) ?? series[0];

    return (
        <div className={styles.widgetContainer}>
            <Widget
                header={i18n.t('Prediction result')}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            >
                <div className={styles.content}>
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
                    <div className={styles.mainLayout}>
                        <div className={styles.sidebar}>
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

                        <div className={styles.plotArea}>
                            {selectedTab === 'chart' && selectedSeries && (
                                <UncertaintyAreaChart
                                    predictionTargetName={predictionTargetName}
                                    series={selectedSeries}
                                />
                            )}
                            {selectedTab === 'table' && selectedSeries && (
                                <PredictionTable
                                    series={selectedSeries}
                                />
                            )}
                            {selectedTab === 'map' && (
                                <PredictionMapWrapper
                                    series={series}
                                    predictionTargetName={predictionTargetName}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </Widget>
        </div>
    );
};
