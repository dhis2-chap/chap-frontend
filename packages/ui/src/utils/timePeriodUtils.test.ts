import { describe, it, expect } from 'vitest';
import {
    PERIOD_TYPES,
    toDHIS2PeriodData,
    convertServerToClientPeriod,
    comparePeriods,
    sortPeriods,
    getLastNPeriods,
} from './timePeriodUtils';

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
            const result = toDHIS2PeriodData('2024-01', '2024-01', 'month');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('202401');
        });

        it('should generate correct month periods for multiple months', () => {
            const result = toDHIS2PeriodData('2024-01', '2024-03', 'month');
            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('202401');
            expect(result[1].id).toBe('202402');
            expect(result[2].id).toBe('202403');
        });

        it('should generate correct month periods spanning years', () => {
            const result = toDHIS2PeriodData('2023-11', '2024-02', 'month');
            expect(result).toHaveLength(4);
            expect(result[0].id).toBe('202311');
            expect(result[1].id).toBe('202312');
            expect(result[2].id).toBe('202401');
            expect(result[3].id).toBe('202402');
        });

        it('should include start and end dates for each month period', () => {
            const result = toDHIS2PeriodData('2024-01', '2024-01', 'month');
            expect(result[0].startDate).toBeDefined();
            expect(result[0].endDate).toBeDefined();
        });
    });

    describe('week periods', () => {
        it('should generate correct week periods for a single week', () => {
            const result = toDHIS2PeriodData('2024-W01', '2024-W01', 'week');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('2024W1');
        });

        it('should generate correct week periods for multiple weeks', () => {
            const result = toDHIS2PeriodData('2024-W01', '2024-W03', 'week');
            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('2024W1');
            expect(result[1].id).toBe('2024W2');
            expect(result[2].id).toBe('2024W3');
        });

        it('should include start and end dates for each week period', () => {
            const result = toDHIS2PeriodData('2024-W01', '2024-W01', 'week');
            expect(result[0].startDate).toBeDefined();
            expect(result[0].endDate).toBeDefined();
        });
    });

    describe('invalid inputs', () => {
        it('should return empty array for invalid period type', () => {
            const result = toDHIS2PeriodData('2024-01', '2024-03', 'invalid');
            expect(result).toEqual([]);
        });
    });
});

describe('convertServerToClientPeriod', () => {
    describe('month periods', () => {
        it('should convert server month format to client format', () => {
            expect(convertServerToClientPeriod('202401', 'MONTH')).toBe('2024-01');
            expect(convertServerToClientPeriod('202312', 'MONTH')).toBe('2023-12');
        });

        it('should handle lowercase period type', () => {
            expect(convertServerToClientPeriod('202401', 'month' as keyof typeof PERIOD_TYPES)).toBe('2024-01');
        });

        it('should return original value for invalid month format', () => {
            expect(convertServerToClientPeriod('invalid', 'MONTH')).toBe('invalid');
        });
    });

    describe('week periods', () => {
        it('should convert server week format to client format', () => {
            expect(convertServerToClientPeriod('2024W01', 'WEEK')).toBe('2024-W01');
            expect(convertServerToClientPeriod('2024W52', 'WEEK')).toBe('2024-W52');
        });

        it('should handle lowercase period type', () => {
            expect(convertServerToClientPeriod('2024W01', 'week' as keyof typeof PERIOD_TYPES)).toBe('2024-W01');
        });

        it('should return original value for invalid week format', () => {
            expect(convertServerToClientPeriod('invalid', 'WEEK')).toBe('invalid');
        });
    });

    describe('unsupported period types', () => {
        it('should return original value for unsupported period type', () => {
            expect(convertServerToClientPeriod('2024', 'YEAR')).toBe('2024');
            expect(convertServerToClientPeriod('20240101', 'DAY')).toBe('20240101');
        });
    });
});

describe('comparePeriods', () => {
    describe('month periods', () => {
        it('should return negative when first period is earlier', () => {
            expect(comparePeriods('202401', '202402', 'MONTH')).toBeLessThan(0);
        });

        it('should return positive when first period is later', () => {
            expect(comparePeriods('202402', '202401', 'MONTH')).toBeGreaterThan(0);
        });

        it('should return zero when periods are equal', () => {
            expect(comparePeriods('202401', '202401', 'MONTH')).toBe(0);
        });

        it('should correctly compare periods across years', () => {
            expect(comparePeriods('202312', '202401', 'MONTH')).toBeLessThan(0);
        });
    });

    describe('week periods', () => {
        it('should return negative when first period is earlier', () => {
            expect(comparePeriods('2024W01', '2024W02', 'WEEK')).toBeLessThan(0);
        });

        it('should return positive when first period is later', () => {
            expect(comparePeriods('2024W02', '2024W01', 'WEEK')).toBeGreaterThan(0);
        });

        it('should return zero when periods are equal', () => {
            expect(comparePeriods('2024W01', '2024W01', 'WEEK')).toBe(0);
        });

        it('should correctly compare periods across years', () => {
            expect(comparePeriods('2023W52', '2024W01', 'WEEK')).toBeLessThan(0);
        });
    });

    describe('unsupported period types', () => {
        it('should fall back to string comparison for unsupported types', () => {
            const result = comparePeriods('2024', '2025', 'YEAR');
            expect(result).toBeLessThan(0);
        });
    });
});

describe('sortPeriods', () => {
    describe('month periods', () => {
        it('should sort month periods chronologically', () => {
            const periods = ['202403', '202401', '202402'];
            const sorted = sortPeriods(periods, 'MONTH');
            expect(sorted).toEqual(['202401', '202402', '202403']);
        });

        it('should sort month periods across years', () => {
            const periods = ['202401', '202312', '202311'];
            const sorted = sortPeriods(periods, 'MONTH');
            expect(sorted).toEqual(['202311', '202312', '202401']);
        });

        it('should not mutate the original array', () => {
            const periods = ['202403', '202401', '202402'];
            sortPeriods(periods, 'MONTH');
            expect(periods).toEqual(['202403', '202401', '202402']);
        });

        it('should handle empty array', () => {
            const sorted = sortPeriods([], 'MONTH');
            expect(sorted).toEqual([]);
        });

        it('should handle single element array', () => {
            const sorted = sortPeriods(['202401'], 'MONTH');
            expect(sorted).toEqual(['202401']);
        });
    });

    describe('week periods', () => {
        it('should sort week periods chronologically', () => {
            const periods = ['2024W03', '2024W01', '2024W02'];
            const sorted = sortPeriods(periods, 'WEEK');
            expect(sorted).toEqual(['2024W01', '2024W02', '2024W03']);
        });

        it('should sort week periods across years', () => {
            const periods = ['2024W01', '2023W52', '2023W51'];
            const sorted = sortPeriods(periods, 'WEEK');
            expect(sorted).toEqual(['2023W51', '2023W52', '2024W01']);
        });
    });
});

describe('getLastNPeriods', () => {
    describe('month periods', () => {
        it('should return the last N months including the base period', () => {
            const result = getLastNPeriods('202412', 'MONTH', 3);
            expect(result).toEqual(['202410', '202411', '202412']);
        });

        it('should return 12 months for a full year', () => {
            const result = getLastNPeriods('202412', 'MONTH', 12);
            expect(result).toHaveLength(12);
            expect(result[0]).toBe('202401');
            expect(result[11]).toBe('202412');
        });

        it('should handle periods spanning years', () => {
            const result = getLastNPeriods('202402', 'MONTH', 4);
            expect(result).toEqual(['202311', '202312', '202401', '202402']);
        });

        it('should return single period when count is 1', () => {
            const result = getLastNPeriods('202412', 'MONTH', 1);
            expect(result).toEqual(['202412']);
        });

        it('should return empty array for invalid base period', () => {
            const result = getLastNPeriods('invalid', 'MONTH', 3);
            expect(result).toEqual([]);
        });

        it('should return empty array for count <= 0', () => {
            expect(getLastNPeriods('202412', 'MONTH', 0)).toEqual([]);
            expect(getLastNPeriods('202412', 'MONTH', -1)).toEqual([]);
        });
    });

    describe('week periods', () => {
        it('should return the last N weeks including the base period', () => {
            const result = getLastNPeriods('2024W10', 'WEEK', 3);
            expect(result).toEqual(['2024W08', '2024W09', '2024W10']);
        });

        it('should handle periods spanning years', () => {
            const result = getLastNPeriods('2024W02', 'WEEK', 4);
            expect(result).toHaveLength(4);
            expect(result[3]).toBe('2024W02');
        });

        it('should return single period when count is 1', () => {
            const result = getLastNPeriods('2024W10', 'WEEK', 1);
            expect(result).toEqual(['2024W10']);
        });

        it('should return empty array for invalid base period', () => {
            const result = getLastNPeriods('invalid', 'WEEK', 3);
            expect(result).toEqual([]);
        });
    });

    describe('unsupported period types', () => {
        it('should return empty array for unsupported period type', () => {
            const result = getLastNPeriods('2024', 'YEAR', 3);
            expect(result).toEqual([]);
        });
    });
});
