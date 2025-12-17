import { describe, it, expect } from 'vitest';
import {
    PERIOD_TYPES,
    toDHIS2PeriodData,
    convertServerToClientPeriod,
    comparePeriods,
    sortPeriods,
    getLastNPeriods,
} from '../timePeriodUtils';

describe('PERIOD_TYPES', () => {
    it('should have the correct period type values', () => {
        expect(PERIOD_TYPES.DAY).toBe('DAY');
        expect(PERIOD_TYPES.WEEK).toBe('WEEK');
        expect(PERIOD_TYPES.MONTH).toBe('MONTH');
        expect(PERIOD_TYPES.YEAR).toBe('YEAR');
        expect(PERIOD_TYPES.ANY).toBe('ANY');
    });
});

describe('toDHIS2PeriodData', () => {
    describe('month periods', () => {
        it('should generate correct month periods for a single month', () => {
            const result = toDHIS2PeriodData('2024-01', '2024-01', PERIOD_TYPES.MONTH);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('202401');
        });

        it('should generate correct month periods for multiple months', () => {
            const result = toDHIS2PeriodData('2024-01', '2024-03', PERIOD_TYPES.MONTH);
            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('202401');
            expect(result[1].id).toBe('202402');
            expect(result[2].id).toBe('202403');
        });

        it('should generate correct month periods spanning years', () => {
            const result = toDHIS2PeriodData('2023-11', '2024-02', PERIOD_TYPES.MONTH);
            expect(result).toHaveLength(4);
            expect(result[0].id).toBe('202311');
            expect(result[1].id).toBe('202312');
            expect(result[2].id).toBe('202401');
            expect(result[3].id).toBe('202402');
        });

        it('should include correct start and end dates for each month period', () => {
            const result = toDHIS2PeriodData('2024-01', '2024-01', PERIOD_TYPES.MONTH);
            expect(result[0].startDate).toEqual(new Date('2024-01-01'));
            expect(result[0].endDate).toEqual(new Date('2024-01-31'));
        });

        it('should have correct start and end dates for February in a leap year', () => {
            const result = toDHIS2PeriodData('2024-02', '2024-02', PERIOD_TYPES.MONTH);
            expect(result[0].startDate).toEqual(new Date('2024-02-01'));
            expect(result[0].endDate).toEqual(new Date('2024-02-29'));
        });
    });

    describe('week periods', () => {
        it('should generate correct week periods for a single week', () => {
            // ISO week 1 of 2024 starts on Monday 2024-01-01 and ends on Sunday 2024-01-07
            const result = toDHIS2PeriodData('2024-W01', '2024-W01', PERIOD_TYPES.WEEK);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('2024W1');
            expect(result[0].startDate).toEqual(new Date('2024-01-01'));
            expect(result[0].endDate).toEqual(new Date('2024-01-07'));
        });

        it('should generate correct week periods for multiple weeks', () => {
            const result = toDHIS2PeriodData('2024-W01', '2024-W03', PERIOD_TYPES.WEEK);
            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('2024W1');
            expect(result[1].id).toBe('2024W2');
            expect(result[2].id).toBe('2024W3');
        });

        it('should include correct start and end dates for week periods crossing years', () => {
            // ISO week 52 of 2023 starts on Monday 2023-12-25 and ends on Sunday 2023-12-31
            // ISO week 1 of 2024 starts on Monday 2024-01-01 and ends on Sunday 2024-01-07
            const result = toDHIS2PeriodData('2023-W52', '2024-W01', PERIOD_TYPES.WEEK);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('2023W52');
            expect(result[0].startDate).toEqual(new Date('2023-12-25'));
            expect(result[0].endDate).toEqual(new Date('2023-12-31'));
            expect(result[1].id).toBe('2024W1');
            expect(result[1].startDate).toEqual(new Date('2024-01-01'));
            expect(result[1].endDate).toEqual(new Date('2024-01-07'));
        });
    });

    describe('invalid inputs', () => {
        it('should return empty array for invalid period type', () => {
            const result = toDHIS2PeriodData('2024-01', '2024-03', 'invalid' as keyof typeof PERIOD_TYPES);
            expect(result).toEqual([]);
        });

        it('should return empty array for invalid month date format', () => {
            const result = toDHIS2PeriodData('invalid', '2024-03', PERIOD_TYPES.MONTH);
            expect(result).toEqual([]);
        });

        it('should return empty array for invalid week date format', () => {
            const result = toDHIS2PeriodData('invalid', '2024-W03', PERIOD_TYPES.WEEK);
            expect(result).toEqual([]);
        });

        it('should return empty array for malformed month format', () => {
            const result = toDHIS2PeriodData('2024/01', '2024/03', PERIOD_TYPES.MONTH);
            expect(result).toEqual([]);
        });

        it('should return empty array for malformed week format', () => {
            const result = toDHIS2PeriodData('2024-1', '2024-3', PERIOD_TYPES.WEEK);
            expect(result).toEqual([]);
        });

        it('should return empty array for unreasonable date range (>100 years)', () => {
            const result = toDHIS2PeriodData('1900-01', '2100-01', PERIOD_TYPES.MONTH);
            expect(result).toEqual([]);
        });

        it('should handle end date before start date for months', () => {
            const result = toDHIS2PeriodData('2024-03', '2024-01', PERIOD_TYPES.MONTH);
            expect(result).toEqual([]);
        });

        it('should handle end date before start date for weeks', () => {
            const result = toDHIS2PeriodData('2024-W03', '2024-W01', PERIOD_TYPES.WEEK);
            expect(result).toEqual([]);
        });
    });
});

describe('convertServerToClientPeriod', () => {
    describe('month periods', () => {
        it('should convert server month format to client format', () => {
            expect(convertServerToClientPeriod('202401', PERIOD_TYPES.MONTH)).toBe('2024-01');
            expect(convertServerToClientPeriod('202312', PERIOD_TYPES.MONTH)).toBe('2023-12');
        });

        it('should handle lowercase period type', () => {
            expect(convertServerToClientPeriod('202401', PERIOD_TYPES.MONTH)).toBe('2024-01');
        });

        it('should return original value for invalid month format', () => {
            expect(convertServerToClientPeriod('invalid', PERIOD_TYPES.MONTH)).toBe('invalid');
        });
    });

    describe('week periods', () => {
        it('should convert server week format to client format', () => {
            expect(convertServerToClientPeriod('2024W01', PERIOD_TYPES.WEEK)).toBe('2024-W01');
            expect(convertServerToClientPeriod('2024W52', PERIOD_TYPES.WEEK)).toBe('2024-W52');
        });

        it('should handle lowercase period type', () => {
            expect(convertServerToClientPeriod('2024W01', PERIOD_TYPES.WEEK)).toBe('2024-W01');
        });

        it('should return original value for invalid week format', () => {
            expect(convertServerToClientPeriod('invalid', PERIOD_TYPES.WEEK)).toBe('invalid');
        });
    });

    describe('unsupported period types', () => {
        it('should return original value for unsupported period type', () => {
            expect(convertServerToClientPeriod('2024', PERIOD_TYPES.YEAR)).toBe('2024');
            expect(convertServerToClientPeriod('20240101', PERIOD_TYPES.DAY)).toBe('20240101');
        });
    });
});

describe('comparePeriods', () => {
    describe('month periods', () => {
        it('should return negative when first period is earlier', () => {
            expect(comparePeriods('202401', '202402', PERIOD_TYPES.MONTH)).toBeLessThan(0);
        });

        it('should return positive when first period is later', () => {
            expect(comparePeriods('202402', '202401', PERIOD_TYPES.MONTH)).toBeGreaterThan(0);
        });

        it('should return zero when periods are equal', () => {
            expect(comparePeriods('202401', '202401', PERIOD_TYPES.MONTH)).toBe(0);
        });

        it('should correctly compare periods across years', () => {
            expect(comparePeriods('202312', '202401', PERIOD_TYPES.MONTH)).toBeLessThan(0);
        });
    });

    describe('week periods', () => {
        it('should return negative when first period is earlier', () => {
            expect(comparePeriods('2024W01', '2024W02', PERIOD_TYPES.WEEK)).toBeLessThan(0);
        });

        it('should return positive when first period is later', () => {
            expect(comparePeriods('2024W02', '2024W01', PERIOD_TYPES.WEEK)).toBeGreaterThan(0);
        });

        it('should return zero when periods are equal', () => {
            expect(comparePeriods('2024W01', '2024W01', PERIOD_TYPES.WEEK)).toBe(0);
        });

        it('should correctly compare periods across years', () => {
            expect(comparePeriods('2023W52', '2024W01', PERIOD_TYPES.WEEK)).toBeLessThan(0);
        });
    });

    describe('unsupported period types', () => {
        it('should fall back to string comparison for unsupported types', () => {
            const result = comparePeriods('2024', '2025', PERIOD_TYPES.YEAR);
            expect(result).toBeLessThan(0);
        });
    });
});

describe('sortPeriods', () => {
    describe('month periods', () => {
        it('should sort month periods chronologically', () => {
            const periods = ['202403', '202401', '202402'];
            const sorted = sortPeriods(periods, PERIOD_TYPES.MONTH);
            expect(sorted).toEqual(['202401', '202402', '202403']);
        });

        it('should sort month periods across years', () => {
            const periods = ['202401', '202312', '202311'];
            const sorted = sortPeriods(periods, PERIOD_TYPES.MONTH);
            expect(sorted).toEqual(['202311', '202312', '202401']);
        });

        it('should not mutate the original array', () => {
            const periods = ['202403', '202401', '202402'];
            sortPeriods(periods, PERIOD_TYPES.MONTH);
            expect(periods).toEqual(['202403', '202401', '202402']);
        });

        it('should handle empty array', () => {
            const sorted = sortPeriods([], PERIOD_TYPES.MONTH);
            expect(sorted).toEqual([]);
        });

        it('should handle single element array', () => {
            const sorted = sortPeriods(['202401'], PERIOD_TYPES.MONTH);
            expect(sorted).toEqual(['202401']);
        });
    });

    describe('week periods', () => {
        it('should sort week periods chronologically', () => {
            const periods = ['2024W03', '2024W01', '2024W02'];
            const sorted = sortPeriods(periods, PERIOD_TYPES.WEEK);
            expect(sorted).toEqual(['2024W01', '2024W02', '2024W03']);
        });

        it('should sort week periods across years', () => {
            const periods = ['2024W01', '2023W52', '2023W51'];
            const sorted = sortPeriods(periods, PERIOD_TYPES.WEEK);
            expect(sorted).toEqual(['2023W51', '2023W52', '2024W01']);
        });
    });
});

describe('getLastNPeriods', () => {
    describe('month periods', () => {
        it('should return the last N months including the base period', () => {
            const result = getLastNPeriods('202412', PERIOD_TYPES.MONTH, 3);
            expect(result).toEqual(['202410', '202411', '202412']);
        });

        it('should return 12 months for a full year', () => {
            const result = getLastNPeriods('202412', PERIOD_TYPES.MONTH, 12);
            expect(result).toHaveLength(12);
            expect(result[0]).toBe('202401');
            expect(result[11]).toBe('202412');
        });

        it('should handle periods spanning years', () => {
            const result = getLastNPeriods('202402', PERIOD_TYPES.MONTH, 4);
            expect(result).toEqual(['202311', '202312', '202401', '202402']);
        });

        it('should return single period when count is 1', () => {
            const result = getLastNPeriods('202412', PERIOD_TYPES.MONTH, 1);
            expect(result).toEqual(['202412']);
        });

        it('should return empty array for invalid base period', () => {
            const result = getLastNPeriods('invalid', PERIOD_TYPES.MONTH, 3);
            expect(result).toEqual([]);
        });

        it('should return empty array for count <= 0', () => {
            expect(getLastNPeriods('202412', PERIOD_TYPES.MONTH, 0)).toEqual([]);
            expect(getLastNPeriods('202412', PERIOD_TYPES.MONTH, -1)).toEqual([]);
        });
    });

    describe('week periods', () => {
        it('should return the last N weeks including the base period', () => {
            const result = getLastNPeriods('2024W10', PERIOD_TYPES.WEEK, 3);
            expect(result).toEqual(['2024W08', '2024W09', '2024W10']);
        });

        it('should handle periods spanning years', () => {
            const result = getLastNPeriods('2024W02', PERIOD_TYPES.WEEK, 4);
            expect(result).toHaveLength(4);
            expect(result[0]).toMatch(/^2023W/);
            expect(result[1]).toMatch(/^2023W/);
            expect(result[2]).toBe('2024W01');
            expect(result[3]).toBe('2024W02');
        });

        it('should return single period when count is 1', () => {
            const result = getLastNPeriods('2024W10', PERIOD_TYPES.WEEK, 1);
            expect(result).toEqual(['2024W10']);
        });

        it('should return empty array for invalid base period', () => {
            const result = getLastNPeriods('invalid', PERIOD_TYPES.WEEK, 3);
            expect(result).toEqual([]);
        });
    });

    describe('unsupported period types', () => {
        it('should return empty array for unsupported period type', () => {
            const result = getLastNPeriods('2024', PERIOD_TYPES.YEAR, 3);
            expect(result).toEqual([]);
        });
    });
});
