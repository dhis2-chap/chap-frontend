import { describe, expect, it } from 'vitest';
import { getIncompatibleOutbreakValues } from './outbreakIndicatorCompatibility';

const dataElement = (valueType: string, codes?: string[]) => ({
    id: 'de',
    displayName: 'Outbreak',
    valueType,
    optionSet: codes ? { options: codes.map(code => ({ code })) } : undefined,
});

describe('getIncompatibleOutbreakValues', () => {
    it('lists the values a value type cannot store, once each', () => {
        expect(getIncompatibleOutbreakValues(dataElement('INTEGER_ZERO_OR_POSITIVE'), ['0', '1'])).toEqual([]);
        expect(getIncompatibleOutbreakValues(dataElement('INTEGER_POSITIVE'), ['0', '1', '0'])).toEqual(['0']);
        expect(getIncompatibleOutbreakValues(dataElement('NUMBER'), ['0', 'red'])).toEqual(['red']);
        expect(getIncompatibleOutbreakValues(dataElement('DATE'), ['1'])).toEqual(['1']);
    });

    it('checks option set codes instead of the value type', () => {
        expect(getIncompatibleOutbreakValues(dataElement('TEXT', ['0', '1']), ['0', '1', '2'])).toEqual(['2']);
    });
});
