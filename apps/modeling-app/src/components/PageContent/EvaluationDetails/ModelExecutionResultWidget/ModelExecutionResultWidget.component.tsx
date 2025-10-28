import React, { useState } from 'react';
import { Menu, MenuItem } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Widget, ComparisonPlot, EvaluationPerOrgUnit } from '@dhis2-chap/ui';
import { SplitPeriodSlider } from '../../../../features/evaluation-compare/SplitPeriodSlider';
import styles from './ModelExecutionResultWidget.module.css';

type Props = {
    orgUnits: string[];
    splitPeriods: string[];
    selectedOrgUnitId: string;
    selectedSplitPeriod: string;
    dataForDisplay?: EvaluationPerOrgUnit;
    periods: string[];
    onSelectOrgUnit: (orgUnitId: string) => void;
    onSelectSplitPeriod: (splitPeriod: string) => void;
};

export const ModelExecutionResultWidgetComponent = ({
    orgUnits,
    splitPeriods,
    selectedOrgUnitId,
    selectedSplitPeriod,
    dataForDisplay,
    periods,
    onSelectOrgUnit,
    onSelectSplitPeriod,
}: Props) => {
    const [open, setOpen] = useState(false);

    return (
        <div className={styles.container}>
            <Widget
                header={i18n.t('Model execution result')}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            >
                <div className={styles.content}>
                    <div className={styles.mainLayout}>
                        <div className={styles.sidebar}>
                            <Menu dense>
                                {orgUnits.map(orgUnitId => (
                                    <MenuItem
                                        active={selectedOrgUnitId === orgUnitId}
                                        key={orgUnitId}
                                        label={orgUnitId}
                                        onClick={() => onSelectOrgUnit(orgUnitId)}
                                    />
                                ))}
                            </Menu>
                        </div>

                        <div className={styles.plotArea}>
                            {dataForDisplay ? (
                                <ComparisonPlot
                                    orgUnitsData={dataForDisplay}
                                    nameLabel={i18n.t('Evaluation')}
                                />
                            ) : (
                                <div className={styles.emptyState}>
                                    <p>{i18n.t('No data available for the selected organization unit and split period.')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {splitPeriods.length > 0 && periods.length > 0 && (
                        <div className={styles.sliderContainer}>
                            <SplitPeriodSlider
                                splitPeriods={splitPeriods}
                                selectedSplitPeriod={selectedSplitPeriod}
                                onChange={onSelectSplitPeriod}
                                periods={periods}
                            />
                        </div>
                    )}
                </div>
            </Widget>
        </div>
    );
};
