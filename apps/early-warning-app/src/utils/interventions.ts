import type { Intervention } from './settings';

export const getInterventions = (interventions: Intervention[], orgUnitLevel: number, alertLevel: string) => (
    interventions.filter(item => item.orgUnitLevel === orgUnitLevel && item.alertLevel === alertLevel)
        .map(item => item.action)
);
