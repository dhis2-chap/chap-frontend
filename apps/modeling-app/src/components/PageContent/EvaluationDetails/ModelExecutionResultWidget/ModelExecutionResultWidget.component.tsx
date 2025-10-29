import React, { useState } from 'react';
import { Menu, MenuItem } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Widget, ResultPlot, EvaluationPerOrgUnit } from '@dhis2-chap/ui';
import { SplitPeriodSlider } from '../../../../features/evaluation-compare/SplitPeriodSlider';
import styles from './ModelExecutionResultWidget.module.css';

type Props = {
    orgUnitIds: string[];
    orgUnitsMap: Map<string, { id: string; displayName: string }>;
    splitPeriods: string[];
    selectedOrgUnitId: string | undefined;
    selectedSplitPeriod: string | undefined;
    dataForDisplay?: EvaluationPerOrgUnit;
    periods: string[];
    onSelectOrgUnit: (orgUnitId: string) => void;
    onSelectSplitPeriod: (splitPeriod: string) => void;
};

export const ModelExecutionResultWidgetComponent = ({
    orgUnitIds,
    orgUnitsMap,
    splitPeriods,
    selectedOrgUnitId,
    selectedSplitPeriod,
    dataForDisplay,
    periods,
    onSelectOrgUnit,
    onSelectSplitPeriod,
}: Props) => {
    const [open, setOpen] = useState(true);

    const model = dataForDisplay?.models?.[0];

    return (
        <div className={styles.container}>
            <Widget
                header={i18n.t('Evaluation result')}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            >
                <div className={styles.content}>
                    <div className={styles.mainLayout}>
                        <div className={styles.sidebar}>
                            <Menu dense>
                                {orgUnitIds.map(orgUnitId => (
                                    <MenuItem
                                        active={selectedOrgUnitId === orgUnitId}
                                        key={orgUnitId}
                                        label={orgUnitsMap.get(orgUnitId)?.displayName ?? orgUnitId}
                                        onClick={() => onSelectOrgUnit(orgUnitId)}
                                    />
                                ))}
                            </Menu>
                        </div>

                        <div className={styles.plotArea}>
                            {model ? (
                                <ResultPlot
                                    data={model.data}
                                    modelName={model.modelName}
                                    syncZoom={false}
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
                                selectedSplitPeriod={selectedSplitPeriod ?? splitPeriods[0]}
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
