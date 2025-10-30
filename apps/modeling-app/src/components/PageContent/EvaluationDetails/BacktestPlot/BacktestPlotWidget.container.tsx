import React, { useState } from 'react';
import { CircularLoader, MenuItem, NoticeBox, SingleSelect } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './BacktestPlotWidget.module.css';
import { BacktestPlotWidgetComponent } from './BacktestPlotWidget.component';
import { useBacktestPlotTypes } from './hooks/useBacktestPlotTypes';
import { Widget } from '@dhis2-chap/ui';

type Props = {
    evaluationId: number;
};

export const BacktestPlotWidget = ({ evaluationId }: Props) => {
    const [open, setOpen] = useState(false);
    const {
        backtestPlotTypes,
        isLoading: isTypesLoading,
        error: typesError,
    } = useBacktestPlotTypes();

    const [selectedVisualizationId, setVisualizationId] = useState<string | undefined>(undefined);

    if (isTypesLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (typesError) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox title={i18n.t('Unable to load data')} error>
                    <p>{i18n.t('There was a problem loading required data. See the browser console for details.')}</p>
                </NoticeBox>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Widget
                header={i18n.t('Backtest plot')}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            >
                <div className={styles.content}>
                    <div className={styles.controlsRow}>
                        <div className={styles.singleSelectContainer}>
                            <SingleSelect
                                dense
                                selected={selectedVisualizationId}
                                placeholder={i18n.t('Select visualization')}
                                onChange={e => setVisualizationId(e.selected)}
                            >
                                {(backtestPlotTypes ?? []).map(v => (
                                    <MenuItem key={v.id} value={v.id} label={v.displayName} />
                                ))}
                            </SingleSelect>
                        </div>
                    </div>

                    <BacktestPlotWidgetComponent
                        evaluationId={evaluationId}
                        selectedVisualizationId={selectedVisualizationId}
                    />
                </div>
            </Widget>
        </div>
    );
};
