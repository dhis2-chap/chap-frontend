import i18n from '@dhis2/d2-i18n';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPeriodNameFromId } from '../Time';

describe('getPeriodNameFromId', () => {
    beforeAll(async () => {
        await i18n.changeLanguage('en');
    });

    afterAll(async () => {
        await i18n.changeLanguage('en');
    });

    it('formats monthly periods', () => {
        expect(getPeriodNameFromId('202403')).toBe('March 2024');
        expect(getPeriodNameFromId('202403', 'short')).toBe('Mar 2024');
    });

    it('formats monthly periods in the active locale', async () => {
        await i18n.changeLanguage('fr');

        expect(getPeriodNameFromId('202403')).toBe('mars 2024');
        expect(getPeriodNameFromId('202403', 'short')).toBe('mars 2024');
    });

    it('passes through periods it does not format', () => {
        expect(getPeriodNameFromId('2024')).toBe('2024');
        expect(getPeriodNameFromId('2024W7')).toBe('Week 7 2024');
        expect(getPeriodNameFromId('202413')).toBe('202413');
        expect(getPeriodNameFromId(undefined)).toBe('NA');
    });
});
