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
                            <DataTableCell align="left">{i18n.t('Quantile median')}</DataTableCell>
                            {series.points.map((pt, idx) => (
                                <DataTableCell key={`median-${idx}`} align="left">
                                    {pt.quantiles.median}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                        <DataTableRow>
                            <DataTableCell className={styles.quantile_low}>{i18n.t('quantile low')}</DataTableCell>
                            {series.points.map((pt, idx) => (
                                <DataTableCell key={`low-${idx}`} className={styles.quantile_low}>
                                    {pt.quantiles.quantile_low}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                        <DataTableRow>
                            <DataTableCell className={styles.quantile_high}>{i18n.t('quantile high')}</DataTableCell>
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
