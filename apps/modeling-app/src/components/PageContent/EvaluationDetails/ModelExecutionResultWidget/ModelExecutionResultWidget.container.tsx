import React, { useMemo } from 'react';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useOrgUnitsById } from '../../../../hooks/useOrgUnitsById';
import { ModelExecutionResultWidgetComponent } from './ModelExecutionResultWidget.component';
import styles from './ModelExecutionResultWidget.module.css';
import { BackTestRead, Widget } from '@dhis2-chap/ui';
import { sortSplitPeriods } from '@/utils/timePeriodUtils';
import { PERIOD_TYPES } from '@/components/ModelExecutionForm/constants';

type Props = {
    backtest: BackTestRead;
};

export const ALL_LOCATIONS_ORG_UNIT = {
    id: ':adm0',
    displayName: i18n.t('All locations') as string,
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

    const {
        data: orgUnitsData,
        isLoading: isOrgUnitsLoading,
        error: orgUnitsError,
    } = useOrgUnitsById(orgUnitIds);

    const orgUnitsMap = useMemo(() => {
        const map = new Map<string, { id: string; displayName: string }>();
        orgUnitsData?.organisationUnits?.forEach((ou) => {
            map.set(ou.id, ou);
        });
        map.set(ALL_LOCATIONS_ORG_UNIT.id, ALL_LOCATIONS_ORG_UNIT);
        return map;
    }, [orgUnitsData]);

    if (isOrgUnitsLoading) {
        return (
            <WidgetWrapper>
                <div className={styles.loadingContainer}>
                    <CircularLoader />
                </div>
            </WidgetWrapper>
        );
    }

    if (orgUnitsError) {
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
            backtest={backtest}
            orgUnitIds={orgUnitIds}
            orgUnitsMap={orgUnitsMap}
            splitPeriods={splitPeriods}
        />
    );
};
