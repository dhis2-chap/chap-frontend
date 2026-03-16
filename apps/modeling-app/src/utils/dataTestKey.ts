export const toDataTestKey = (value: string): string => {
    const normalized = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalized || 'unknown';
};
