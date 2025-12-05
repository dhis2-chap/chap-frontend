/**
 * Generates a SHA-256 hash from the provided data using the Web Crypto API
 * @param data - The data to hash
 * @returns Promise<string> - The hex-encoded hash string
 */
export const generateSHA256Hash = async (data: any): Promise<string> => {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Generates a unique hash for backtest data caching based on data elements, periods, and org units
 * @param dataElements - Array of data element IDs
 * @param periods - Array of period strings
 * @param orgUnitIds - Array of org unit IDs
 * @returns Promise<string> - The hex-encoded hash string
 */
export const generateBacktestDataHash = async (
    dataElements: string[],
    periods: string[],
    orgUnitIds: string[],
): Promise<string> => {
    return generateSHA256Hash({
        dataElements,
        periods,
        orgUnits: orgUnitIds,
    });
};
