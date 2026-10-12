import type { AlertRead } from '@dhis2-chap/ui';
import type { Bulletin } from './settings';

export type OrgUnitRef = { id: string; displayName: string; level: number };
export type OrgUnitInfo = OrgUnitRef & { ancestors?: OrgUnitRef[] };
export type DecisionChanges = { accepted: AlertRead[]; declined: AlertRead[]; withdrawn: AlertRead[] };
export type BulletinMessage = {
    key: string;
    bulletinName: string;
    orgUnit?: OrgUnitRef;
    subject: string;
    text: string;
    userGroupIds: string[];
    orgUnitIds: string[];
};
export type BulletinFormatters = {
    acceptedLine: (alert: AlertRead) => string;
    decisionLine: (alert: AlertRead, decision: 'accepted' | 'declined' | 'withdrawn') => string;
};
export const fillBulletinTemplate = (template: string, values: Record<string, string>) => (
    template.replace(/\{(\w+)\}/g, (placeholder, key: string) => values[key] ?? placeholder)
);

export const buildBulletinMessages = (
    bulletins: Bulletin[],
    changes: DecisionChanges,
    _orgUnits: Map<string, OrgUnitInfo>,
    values: Record<string, string>,
    format: BulletinFormatters,
): BulletinMessage[] => bulletins.flatMap((bulletin, index) => {
    const triggered = bulletin.sendOn === 'alerts'
        ? changes.accepted.length + changes.withdrawn.length > 0
        : changes.accepted.length + changes.declined.length + changes.withdrawn.length > 0;
    if (!triggered || !bulletin.recipientUserGroupIds.length) return [];
    const withdrawn = new Set(changes.withdrawn.map(alert => alert.id));
    const replacements = {
        ...values,
        count: String(changes.accepted.length),
        orgUnit: '',
        alerts: [...changes.accepted.map(format.acceptedLine), ...changes.withdrawn.map(alert => format.decisionLine(alert, 'withdrawn'))].join('\n'),
        decisions: [
            ...changes.accepted.map(alert => format.decisionLine(alert, 'accepted')),
            ...changes.declined.filter(alert => !withdrawn.has(alert.id)).map(alert => format.decisionLine(alert, 'declined')),
            ...changes.withdrawn.map(alert => format.decisionLine(alert, 'withdrawn')),
        ].join('\n'),
    };
    return [{
        key: String(index), bulletinName: bulletin.name,
        subject: fillBulletinTemplate(bulletin.subjectTemplate, replacements),
        text: fillBulletinTemplate(bulletin.bodyTemplate, replacements),
        userGroupIds: bulletin.recipientUserGroupIds, orgUnitIds: [],
    }];
});
