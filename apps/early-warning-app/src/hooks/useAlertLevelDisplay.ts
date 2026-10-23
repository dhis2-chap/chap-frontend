import { useCallback } from 'react';
import {
    getAlertLevelDisplay,
    useAlertPolicyDisplays,
    type AlertLevelDisplay,
    type AlertPolicyRead,
} from '@dhis2-chap/ui';

// Level colours are set per policy in the Modeling App; levels without one get its default colours.
export const useAlertLevelDisplay = (policies: AlertPolicyRead[]) => {
    const displays = useAlertPolicyDisplays(policies.map(policy => policy.id));
    return useCallback((level: string, alertPolicyId: number): AlertLevelDisplay => getAlertLevelDisplay(
        level,
        policies.find(policy => policy.id === alertPolicyId),
        displays.data?.[alertPolicyId],
    ), [policies, displays.data]);
};
