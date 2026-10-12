import { describe, expect, it } from 'vitest';
import type { AlertPolicyRead } from '@dhis2-chap/ui';
import { getReviewLevelColors } from './alertLevels';

describe('default alert level colours', () => {
    it('assigns distinct colours in policy order and shares colours for repeated level names', () => {
        const policies = [
            { levels: [{ name: 'Warning' }, { name: 'Alarm' }] },
            { levels: [{ name: 'Warning' }, { name: 'Emergency' }] },
        ] as AlertPolicyRead[];
        const colors = getReviewLevelColors(policies);
        expect(Object.keys(colors)).toEqual(['Warning', 'Alarm', 'Emergency']);
        expect(new Set(Object.values(colors)).size).toBe(3);
        expect(getReviewLevelColors(policies)).toEqual(colors);
    });

    it('supports an empty policy list and more levels than the default palette', () => {
        expect(getReviewLevelColors([])).toEqual({});
        const policies = [{ levels: ['A', 'B', 'C', 'D', 'E'].map(name => ({ name })) }] as AlertPolicyRead[];
        const colors = getReviewLevelColors(policies);
        expect(Object.values(colors).every(color => /^#[0-9a-f]{6}$/i.test(color))).toBe(true);
        expect(colors.E).toBe(colors.D);
    });
});
