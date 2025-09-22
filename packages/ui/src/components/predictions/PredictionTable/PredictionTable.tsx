import React from 'react';
import i18n from '@dhis2/d2-i18n';
import styles from './PredictionTable.module.css';
import { PredictionResponseExtended } from '../../../interfaces/Prediction';
import { getUniqePeriods, getUniqeQuantiles } from '../../../utils/PredictionResponse';
import { createFixedPeriodFromPeriodId } from '@dhis2/multi-calendar-dates';
import {
    DataTable,
    DataTableHead,
    DataTableRow,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
} from '@dhis2/ui';

interface PredictionTableProps {
    data: PredictionResponseExtended[];
}

export const PredictionTable = ({ data }: PredictionTableProps) => {
    const orgUnitId = data[0]?.orgUnit ?? 'ou';
    const uniquePeriods = getUniqePeriods(data);
    const uniqueQuantiles = getUniqeQuantiles(data);
    return (
        <>
            <div key={orgUnitId}>
                <DataTable className={styles.table}>
                    <DataTableHead>
                        <DataTableRow>
                            <DataTableColumnHeader>
                                {i18n.t('Quantiles')}
                            </DataTableColumnHeader>
                            {uniquePeriods.map((p: string) => (
                                <DataTableColumnHeader key={p}>
                                    {createFixedPeriodFromPeriodId({
                                        periodId: p,
                                        calendar: 'gregory',
                                    }).displayName}
                                </DataTableColumnHeader>
                            ))}
                        </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                        {uniqueQuantiles.map((q: string) => (
                            <DataTableRow key={q}>
                                <DataTableCell>{q.replaceAll('_', ' ')}</DataTableCell>
                                {uniquePeriods.map((p: string) => (
                                    <DataTableCell key={`${q}-${p}`}>
                                        {data.find((d: PredictionResponseExtended) => d.dataElement === q && d.period === p)?.value}
                                    </DataTableCell>
                                ))}
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </div>
        </>
    );
};
