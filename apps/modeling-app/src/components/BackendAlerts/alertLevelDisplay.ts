import i18n from '@dhis2/d2-i18n';
import { z } from 'zod';
import type { AlertPolicyRead } from '@dhis2-chap/ui';

export const ALERT_COLORS = {
    green: { label: i18n.t('Green'), color: '#27783e', background: '#e3f3e7' },
    yellow: { label: i18n.t('Yellow'), color: '#715600', background: '#fff4c2' },
    orange: { label: i18n.t('Orange'), color: '#984900', background: '#ffead5' },
    red: { label: i18n.t('Red'), color: '#a82020', background: '#fce2e2' },
    purple: { label: i18n.t('Purple'), color: '#713a91', background: '#f0e5f7' },
} as const;

export const alertColorSchema = z.enum(['green', 'yellow', 'orange', 'red', 'purple']);
export type AlertColor = z.infer<typeof alertColorSchema>;
export const alertLevelDisplaySchema = z.object({
    label: z.string().trim().min(1),
    color: alertColorSchema,
});
export const alertPolicyDisplaySchema = z.record(alertLevelDisplaySchema);
export type AlertLevelDisplay = z.infer<typeof alertLevelDisplaySchema>;
export type AlertPolicyDisplay = z.infer<typeof alertPolicyDisplaySchema>;

export const getAlertLevelDisplay = (
    levelName: string,
    policy?: AlertPolicyRead,
    display?: AlertPolicyDisplay,
): AlertLevelDisplay => {
    if (display && Object.prototype.hasOwnProperty.call(display, levelName)) return display[levelName];
    const levels = policy?.levels ?? [];
    const index = levels.findIndex(level => level.name === levelName);
    return {
        label: levelName,
        color: index === levels.length - 1 && index >= 0
            ? 'red'
            : index === 0 && levels.length > 2 ? 'yellow' : 'orange',
    };
};
