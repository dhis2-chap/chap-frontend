import React from 'react';
import i18n from '@dhis2/d2-i18n';
import styles from './PredictionTable.module.css';
import { PredictionOrgUnitSeries } from '../../../interfaces/Prediction';
import {
    DataTable,
    DataTableHead,
    DataTableRow,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
} from '@dhis2/ui';

interface PredictionTableProps {
    series: PredictionOrgUnitSeries;
}

export const PredictionTable = ({ series }: PredictionTableProps) => {
    const orgUnitId = series.orgUnitId ?? 'ou';
    const periods = series.points.map(p => p.periodLabel);
    return (
        <>
            <div key={orgUnitId}>
                <DataTable className={styles.table}>
                    <DataTableHead>
                        <DataTableRow>
                            <DataTableColumnHeader className={styles.headerRight}>
                                {i18n.t('Quantiles')}
                            </DataTableColumnHeader>
                            {periods.map((label: string, idx: number) => (
                                <DataTableColumnHeader
                                    className={styles.headerRight}
                                    key={`${orgUnitId}-${idx}`}
                                >
                                    {label}
                                </DataTableColumnHeader>
                            ))}
                        </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                        <DataTableRow>
                            <DataTableCell className={styles.quantile_low}>{i18n.t('Quantile 0.1 (low)')}</DataTableCell>
                            {series.points.map((pt, idx) => (
                                <DataTableCell key={`low-${idx}`} className={styles.quantile_low}>
                                    {pt.quantiles.quantile_low}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                        <DataTableRow>
                            <DataTableCell>{i18n.t('Quantile 0.25')}</DataTableCell>
                            {series.points.map((pt, idx) => (
                                <DataTableCell key={`mid-low-${idx}`}>
                                    {pt.quantiles.quantile_mid_low}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                        <DataTableRow>
                            <DataTableCell align="left">{i18n.t('Quantile 0.5 (median)')}</DataTableCell>
                            {series.points.map((pt, idx) => (
                                <DataTableCell key={`median-${idx}`} align="left">
                                    {pt.quantiles.median}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                        <DataTableRow>
                            <DataTableCell>{i18n.t('Quantile 0.75')}</DataTableCell>
                            {series.points.map((pt, idx) => (
                                <DataTableCell key={`mid-high-${idx}`}>
                                    {pt.quantiles.quantile_mid_high}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                        <DataTableRow>
                            <DataTableCell className={styles.quantile_high}>{i18n.t('Quantile 0.9 (high)')}</DataTableCell>
                            {series.points.map((pt, idx) => (
                                <DataTableCell key={`high-${idx}`} className={styles.quantile_high}>
                                    {pt.quantiles.quantile_high}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                    </DataTableBody>
                </DataTable>
            </div>
        </>
    );
};
