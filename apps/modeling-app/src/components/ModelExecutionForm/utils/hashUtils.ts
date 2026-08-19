/**
 * Generates a unique cache key for backtest data based on data elements, periods, and org units.
 * A plain concatenated string is used instead of a cryptographic hash so the key
 * can be computed in any browsing context (crypto.subtle requires HTTPS/localhost).
 * @param dataElements - Array of data element IDs
 * @param periods - Array of period strings
 * @param orgUnitIds - Array of org unit IDs
 * @returns string - The cache key
 */
export const generateBacktestDataHash = (
    dataElements: string[],
    periods: string[],
    orgUnitIds: string[],
): string => {
    return [
        dataElements.join(','),
        periods.join(','),
        orgUnitIds.join(','),
    ].join('|');
};
