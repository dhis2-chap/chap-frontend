import type { QuantileTarget } from '@dhis2-chap/ui';

export const SETTINGS_NAMESPACE = 'chap-early-warning';
export const SETTINGS_KEY = 'settings';
export type Intervention = { orgUnitLevel: number; alertLevel: string; action: string };
export type Bulletin = {
    name: string;
    orgUnitLevel?: number;
    sendOn: 'alerts' | 'decisions';
    recipientUserGroupIds: string[];
    notifyOrgUnitUsers: boolean;
    subjectTemplate: string;
    bodyTemplate: string;
};
export type Settings = {
    interventions: Intervention[];
    bulletins: Bulletin[];
    levelColors: Record<string, string>;
    importMappings: Record<string, QuantileTarget[]>;
    bulletinDashboardId?: string;
};
export const getDefaultSettings = (): Settings => ({
    interventions: [], bulletins: [], levelColors: {}, importMappings: {},
});
export const normalizeSettings = (stored: Partial<Settings>): Settings => ({
    ...getDefaultSettings(), ...stored,
});
export const hasReviewAuthority = (authorities: string[]) => (
    authorities.includes('ALL') || authorities.includes('F_CHAP_EARLY_WARNING_APPROVE')
);
