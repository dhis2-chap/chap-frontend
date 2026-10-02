import { AlertsService, type AlertRead } from '@dhis2-chap/ui';

/** Scope by runs, not policy: policies can be shared and replaced over time. */
export const loadPredictionAlerts = async (predictionIds: number[]): Promise<AlertRead[]> => {
    const alerts: AlertRead[] = [];
    // Bound concurrency rather than dispatching a request for every historical run at once.
    const ids = [...new Set(predictionIds)].filter(id => Number.isInteger(id) && id > 0);
    for (let start = 0; start < ids.length; start += 4) {
        const batch = ids.slice(start, start + 4);
        const results = await Promise.all(batch.map(id => AlertsService.listAlertsV1CrudAlertsGet(undefined, id)));
        results.forEach((rows, index) => alerts.push(...rows.filter(row => row.predictionId === batch[index])));
    }
    return alerts.sort((a, b) => b.timePeriod.localeCompare(a.timePeriod) || a.orgUnit.localeCompare(b.orgUnit) || b.id - a.id);
};
