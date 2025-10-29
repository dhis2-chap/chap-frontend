import React, { useMemo, useState } from 'react';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { usePlotDataForOrgUnit } from '../../../../hooks/usePlotDataForOrgUnit';
import { useOrgUnitsById } from '../../../../hooks/useOrgUnitsById';
import { ModelExecutionResultWidgetComponent } from './ModelExecutionResultWidget.component';
import styles from './ModelExecutionResultWidget.module.css';
import { BackTestRead, Widget } from '@dhis2-chap/ui';
import { sortSplitPeriods } from '@/utils/timePeriodUtils';
import { PERIOD_TYPES } from '@/components/ModelExecutionForm/constants';

type Props = {
    backtest: BackTestRead;
};

const WidgetWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <Widget
            header={i18n.t('Result')}
            open
            onOpen={() => { }}
            onClose={() => { }}
        >
            {children}
        </Widget>
    );
};

export const ModelExecutionResultWidget = ({ backtest }: Props) => {
    const orgUnitIds = backtest.orgUnits ?? [];
    const splitPeriods = sortSplitPeriods(backtest.splitPeriods ?? [], backtest.dataset.periodType as keyof typeof PERIOD_TYPES);

    const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string | undefined>(orgUnitIds[0]);
    const [selectedSplitPeriod, setSelectedSplitPeriod] = useState<string | undefined>(splitPeriods[0]);

    const {
        data: orgUnitsData,
        isLoading: isOrgUnitsLoading,
        error: orgUnitsError,
    } = useOrgUnitsById(orgUnitIds);

    const {
        viewData,
        isLoading: isPlotDataLoading,
        error: plotDataError,
    } = usePlotDataForOrgUnit(backtest, selectedOrgUnitId);

    const orgUnitsMap = useMemo(() => {
        const map = new Map<string, { id: string; displayName: string }>();
        orgUnitsData?.organisationUnits?.forEach((ou) => {
            map.set(ou.id, ou);
        });
        return map;
    }, [orgUnitsData]);

    const { dataForSplitPeriod, periods } = useMemo(() => {
        const dataForSplitPeriod = viewData
            .filter(v => v.splitPoint === selectedSplitPeriod)
            .flatMap(v =>
                v.evaluation.map(e => ({
                    ...e,
                    orgUnitName:
                        orgUnitsMap.get(e.orgUnitId)?.displayName ?? e.orgUnitId,
                })),
            )
            .sort((a, b) => a.orgUnitName.localeCompare(b.orgUnitName));
        const periods = dataForSplitPeriod[0]?.models[0].data.periods ?? [];
        return { dataForSplitPeriod, periods };
    }, [viewData, selectedSplitPeriod, orgUnitsMap]);

    if (isPlotDataLoading || isOrgUnitsLoading) {
        return (
            <WidgetWrapper>
                <div className={styles.loadingContainer}>
                    <CircularLoader />
                </div>
            </WidgetWrapper>
        );
    }

    if (plotDataError || orgUnitsError) {
        return (
            <WidgetWrapper>
                <div className={styles.errorContainer}>
                    <NoticeBox title={i18n.t('Unable to load data')} error>
                        <p>{i18n.t('There was a problem loading required data. See the browser console for details.')}</p>
                    </NoticeBox>
                </div>
            </WidgetWrapper>
        );
    }

    return (
        <ModelExecutionResultWidgetComponent
            orgUnitIds={orgUnitIds}
            orgUnitsMap={orgUnitsMap}
            splitPeriods={splitPeriods}
            selectedOrgUnitId={selectedOrgUnitId}
            selectedSplitPeriod={selectedSplitPeriod}
            dataForDisplay={dataForSplitPeriod.find(e => e.orgUnitId === selectedOrgUnitId)}
            periods={periods}
            onSelectOrgUnit={setSelectedOrgUnitId}
            onSelectSplitPeriod={setSelectedSplitPeriod}
        />
    );
};
