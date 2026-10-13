import type { ForecastDataValue } from '@dhis2-chap/core';
import type { AlertRead } from '@dhis2-chap/ui';
import { alertCell } from './import';

export type ImportedIndicator = Omit<ForecastDataValue, 'value'> & { alertId: number };
const key = (value: ImportedIndicator) => `${value.alertId}|${value.dataElement}|${alertCell(value.orgUnit, value.period)}`;

export const getWithdrawnIndicators = (records: ImportedIndicator[], declined: AlertRead[]) => {
    const ids = new Set(declined.map(alert => alert.id));
    return records.filter(record => ids.has(record.alertId));
};

export const updateImportLedger = (
    records: ImportedIndicator[],
    imported: ImportedIndicator[],
    cleared: ImportedIndicator[],
): ImportedIndicator[] => {
    const removed = new Set(cleared.map(key));
    return [...new Map([...records.filter(record => !removed.has(key(record))), ...imported].map(record => [key(record), record])).values()];
};

export const describeImportedIndicators = (values: ForecastDataValue[], indicatorId: string | undefined, accepted: AlertRead[]): ImportedIndicator[] => values.flatMap((value) => {
    if (value.dataElement !== indicatorId || value.value !== '1') return [];
    const alert = accepted.find(alert => alertCell(alert.orgUnit, alert.timePeriod) === alertCell(value.orgUnit, value.period));
    return alert ? [{ alertId: alert.id, dataElement: value.dataElement, orgUnit: value.orgUnit, period: value.period }] : [];
});
