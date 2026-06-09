const isRecord = (value: unknown): value is Record<string, unknown> => (
    !!value && typeof value === 'object' && !Array.isArray(value)
);

const getResponseRecord = (result: unknown): Record<string, unknown> | undefined => {
    if (!isRecord(result)) {
        return undefined;
    }

    return isRecord(result.response) ? result.response : result;
};

const hasConflicts = (response: Record<string, unknown> | undefined): boolean => {
    const conflicts = response?.conflicts ?? response?.importConflicts;
    return Array.isArray(conflicts) && conflicts.length > 0;
};

const hasRejectedIndexes = (response: Record<string, unknown> | undefined): boolean => (
    Array.isArray(response?.rejectedIndexes) && response.rejectedIndexes.length > 0
);

export const assertDataValueSetImportAccepted = (
    result: unknown,
    { allowIgnored }: { allowIgnored: boolean },
) => {
    const response = getResponseRecord(result);
    const status = response?.status;

    if (status === 'ERROR') {
        throw new Error('DHIS2 rejected the data value import.');
    }

    if (!allowIgnored && hasConflicts(response)) {
        throw new Error('DHIS2 reported conflicts while importing data values.');
    }

    if (!allowIgnored && hasRejectedIndexes(response)) {
        throw new Error('DHIS2 rejected one or more data values.');
    }
};
