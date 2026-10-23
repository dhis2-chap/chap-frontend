import { z } from 'zod';
import type { AlertPolicyRead } from '@dhis2-chap/ui';

const outputCodeSchema = z.string().trim().min(1);
export const alertPolicyOutputCodesSchema = z.object({
    noAlert: outputCodeSchema,
    levels: z.record(outputCodeSchema),
}).refine(({ noAlert, levels }) => {
    const codes = [noAlert, ...Object.values(levels)];
    return new Set(codes).size === codes.length;
});
export type AlertPolicyOutputCodes = z.infer<typeof alertPolicyOutputCodesSchema>;

export const getDefaultAlertPolicyOutputCodes = (policy: AlertPolicyRead): AlertPolicyOutputCodes => ({
    noAlert: '0',
    levels: Object.fromEntries((policy.levels ?? []).map((level, index) => [level.name, String(index + 1)])),
});
