import { describe, expect, it } from 'vitest';
import { assertDataValueSetImportAccepted } from './dataValueSetImportSummary';

describe('assertDataValueSetImportAccepted', () => {
    it('accepts ignored values when DHIS2 reports no conflicts or rejected indexes', () => {
        expect(() => assertDataValueSetImportAccepted({
            response: {
                status: 'SUCCESS',
                importCount: {
                    imported: 58,
                    updated: 204,
                    ignored: 3,
                    deleted: 0,
                },
                conflicts: [],
                rejectedIndexes: [],
            },
        }, { allowIgnored: false })).not.toThrow();
    });

    it('rejects values when DHIS2 reports conflicts', () => {
        expect(() => assertDataValueSetImportAccepted({
            response: {
                status: 'WARNING',
                importCount: {
                    imported: 0,
                    updated: 0,
                    ignored: 1,
                    deleted: 0,
                },
                conflicts: [
                    {
                        object: 'notARealId12',
                        value: 'Data element not found or not accessible: `notARealId12`',
                    },
                ],
                rejectedIndexes: [0],
            },
        }, { allowIgnored: false })).toThrow(
            'DHIS2 reported conflicts while importing data values.',
        );
    });

    it('rejects values when DHIS2 reports rejected indexes without conflicts', () => {
        expect(() => assertDataValueSetImportAccepted({
            response: {
                status: 'WARNING',
                importCount: {
                    imported: 0,
                    updated: 0,
                    ignored: 1,
                    deleted: 0,
                },
                conflicts: [],
                rejectedIndexes: [0],
            },
        }, { allowIgnored: false })).toThrow(
            'DHIS2 rejected one or more data values.',
        );
    });
});
