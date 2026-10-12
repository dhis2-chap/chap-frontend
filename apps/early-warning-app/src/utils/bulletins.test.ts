import { describe, expect, it } from 'vitest';
import type { AlertRead } from '@dhis2-chap/ui';
import { buildBulletinMessages, fillBulletinTemplate } from './bulletins';
import { getDefaultBulletin } from './bulletinSettings';

const alert: AlertRead = { id: 1, orgUnit: 'unitA', timePeriod: '2026-01', level: 'high', alertPolicyId: 1 };
const bulletin = { ...getDefaultBulletin(), recipientUserGroupIds: ['groupA'], bodyTemplate: '{decisions}\n{alerts}' };
const format = { acceptedLine: () => 'accepted: action', decisionLine: (_alert: AlertRead, decision: string) => decision };
describe('bulletin content', () => {
    it('does not interpret replacement values as template syntax', () => {
        expect(fillBulletinTemplate('{reviewer}', { reviewer: '$& {prediction}' })).toBe('$& {prediction}');
    });
    it('includes withdrawals and matching accepted alert actions', () => {
        const messages = buildBulletinMessages([bulletin], { accepted: [alert], declined: [{ ...alert, id: 2 }], withdrawn: [{ ...alert, id: 2 }] }, new Map(), {}, format);
        expect(messages[0].text).toBe('accepted\nwithdrawn\naccepted: action\nwithdrawn');
    });
    it('only triggers alert bulletins for acceptance or withdrawal', () => {
        const changes = { accepted: [], declined: [alert], withdrawn: [] };
        expect(buildBulletinMessages([bulletin], changes, new Map(), {}, format)).toEqual([]);
        expect(buildBulletinMessages([{ ...bulletin, sendOn: 'decisions' }], changes, new Map(), {}, format)).toHaveLength(1);
    });
    it('does not send unaddressed messages', () => {
        expect(buildBulletinMessages([{ ...bulletin, recipientUserGroupIds: [] }], { accepted: [alert], declined: [], withdrawn: [] }, new Map(), {}, format)).toEqual([]);
    });
});

it('isolates each district bulletin, including withdrawals and organisation unit recipients', () => {
    const a = { id: 'districtA', displayName: 'District A', level: 2 };
    const b = { id: 'districtB', displayName: 'District B', level: 2 };
    const units = new Map([
        ['unitA', { id: 'unitA', displayName: 'Clinic A', level: 3, ancestors: [a] }],
        ['unitB', { id: 'unitB', displayName: 'Clinic B', level: 3, ancestors: [b] }],
    ]);
    const withdrawn = { ...alert, id: 2, orgUnit: 'unitB' };
    const messages = buildBulletinMessages([{ ...bulletin, orgUnitLevel: 2, notifyOrgUnitUsers: true, recipientUserGroupIds: [], bodyTemplate: '{orgUnit}\n{alerts}' }], {
        accepted: [alert], declined: [withdrawn], withdrawn: [withdrawn],
    }, units, {}, { acceptedLine: value => value.orgUnit, decisionLine: value => `withdrawn ${value.orgUnit}` });
    expect(messages.map(message => message.text)).toEqual(['District A\nunitA', 'District B\nwithdrawn unitB']);
    expect(messages.map(message => message.orgUnitIds)).toEqual([['districtA'], ['districtB']]);
});

it('never falls back to a whole-review message for missing organisation unit metadata', () => {
    expect(buildBulletinMessages([{ ...bulletin, orgUnitLevel: 2 }], { accepted: [alert], declined: [], withdrawn: [] }, new Map(), {}, format)).toEqual([]);
});

it('includes a withdrawal supplied without a declined duplicate', () => {
    const messages = buildBulletinMessages([{ ...bulletin, sendOn: 'decisions' }], { accepted: [], declined: [], withdrawn: [alert] }, new Map(), {}, format);
    expect(messages[0].text).toBe('withdrawn\nwithdrawn');
});
