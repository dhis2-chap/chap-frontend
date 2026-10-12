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

export const getOrgUnitAtLevel = (unit: OrgUnitInfo | undefined, level: number): OrgUnitRef | undefined => (
    unit?.level === level ? unit : unit?.ancestors?.find(ancestor => ancestor.level === level)
);

export const buildBulletinMessages = (
    bulletins: Bulletin[],
    changes: DecisionChanges,
    orgUnits: Map<string, OrgUnitInfo>,
    values: Record<string, string>,
    format: BulletinFormatters,
): BulletinMessage[] => {
    const messages: BulletinMessage[] = [];
    for (const [index, bulletin] of bulletins.entries()) {
        const groups = new Map<string, OrgUnitRef | undefined>();
        if (bulletin.orgUnitLevel === undefined) groups.set('all', undefined);
        else {
            for (const alert of [...changes.accepted, ...changes.declined, ...changes.withdrawn]) {
                const unit = getOrgUnitAtLevel(orgUnits.get(alert.orgUnit), bulletin.orgUnitLevel);
                if (unit) groups.set(unit.id, unit);
            }
        }
        for (const [groupId, orgUnit] of groups) {
            const belongs = (alert: AlertRead) => !orgUnit || getOrgUnitAtLevel(orgUnits.get(alert.orgUnit), bulletin.orgUnitLevel!)?.id === groupId;
            const accepted = changes.accepted.filter(belongs);
            const declined = changes.declined.filter(belongs);
            const withdrawn = changes.withdrawn.filter(belongs);
            const triggered = bulletin.sendOn === 'alerts'
                ? accepted.length + withdrawn.length > 0
                : accepted.length + declined.length + withdrawn.length > 0;
            const orgUnitIds = orgUnit && bulletin.notifyOrgUnitUsers ? [orgUnit.id] : [];
            if (!triggered || (!bulletin.recipientUserGroupIds.length && !orgUnitIds.length)) continue;
            const withdrawnIds = new Set(withdrawn.map(alert => alert.id));
            const replacements = {
                ...values,
                count: String(accepted.length),
                orgUnit: orgUnit?.displayName ?? '',
                alerts: [...accepted.map(format.acceptedLine), ...withdrawn.map(alert => format.decisionLine(alert, 'withdrawn'))].join('\n'),
                decisions: [
                    ...accepted.map(alert => format.decisionLine(alert, 'accepted')),
                    ...declined.filter(alert => !withdrawnIds.has(alert.id)).map(alert => format.decisionLine(alert, 'declined')),
                    ...withdrawn.map(alert => format.decisionLine(alert, 'withdrawn')),
                ].join('\n'),
            };
            messages.push({
                key: `${index}:${groupId}`, bulletinName: bulletin.name, orgUnit,
                subject: fillBulletinTemplate(bulletin.subjectTemplate, replacements),
                text: fillBulletinTemplate(bulletin.bodyTemplate, replacements),
                userGroupIds: bulletin.recipientUserGroupIds, orgUnitIds,
            });
        }
    }
    return messages;
};
