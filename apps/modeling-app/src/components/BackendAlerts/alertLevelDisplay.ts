import i18n from '@dhis2/d2-i18n';
import { z } from 'zod';
import type { AlertPolicyRead } from '@dhis2-chap/ui';

// Swatch colours follow the green/yellow/orange/red scale used by public warning systems.
export const ALERT_COLORS = {
    green: { label: i18n.t('Green'), color: '#43a047', background: '#e3f3e7' },
    yellow: { label: i18n.t('Yellow'), color: '#ffc107', background: '#fff4c2' },
    orange: { label: i18n.t('Orange'), color: '#fb8c00', background: '#ffead5' },
    red: { label: i18n.t('Red'), color: '#e53935', background: '#fce2e2' },
} as const;

const presetColorSchema = z.enum(['green', 'yellow', 'orange', 'red']);
export const PRESET_COLORS = presetColorSchema.options;
export const alertColorSchema = z.union([presetColorSchema, z.string().regex(/^#[0-9a-f]{6}$/i)]);
export type AlertColor = z.infer<typeof alertColorSchema>;

export const getAlertColor = (value: AlertColor) => {
    const preset = presetColorSchema.safeParse(value);
    if (preset.success) {
        return ALERT_COLORS[preset.data];
    }
    return { color: value, background: `${value}26` };
};

// Only the colour is stored per level; the label is always the policy's level name.
export const alertLevelColorSchema = z.object({ color: alertColorSchema });
export const alertPolicyDisplaySchema = z.record(alertLevelColorSchema);
export type AlertPolicyDisplay = z.infer<typeof alertPolicyDisplaySchema>;
export type AlertLevelDisplay = { label: string; color: AlertColor };

export const getAlertLevelDisplay = (
    levelName: string,
    policy?: AlertPolicyRead,
    display?: AlertPolicyDisplay,
): AlertLevelDisplay => {
    if (display && Object.prototype.hasOwnProperty.call(display, levelName)) {
        return { label: levelName, color: display[levelName].color };
    }
    const levels = policy?.levels ?? [];
    const index = levels.findIndex(level => level.name === levelName);
    return {
        label: levelName,
        color: index === levels.length - 1 && index >= 0
            ? 'red'
            : index === 0 && levels.length > 2 ? 'yellow' : 'orange',
    };
};
