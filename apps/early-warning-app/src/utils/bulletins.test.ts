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

it('includes a withdrawal supplied without a declined duplicate', () => {
    const messages = buildBulletinMessages([{ ...bulletin, sendOn: 'decisions' }], { accepted: [], declined: [], withdrawn: [alert] }, new Map(), {}, format);
    expect(messages[0].text).toBe('withdrawn\nwithdrawn');
});
