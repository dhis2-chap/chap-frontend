/**
 * Compares two version strings in the format "major.minor.patch".
 * Returns -1 if version1 is less than version2, 1 if version1 is greater than version2, and 0 if they are equal.
 *
 * @param {string} version1 - The first version string to compare.
 * @param {string} version2 - The second version string to compare.
 * @returns {number} - Comparison result: -1, 0, or 1.
 */
export const compareVersions = (version1: string, version2: string): number => {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)

    const maxLength = Math.max(v1Parts.length, v2Parts.length)

    for (let i = 0; i < maxLength; i++) {
        const part1 = v1Parts[i] || 0
        const part2 = v2Parts[i] || 0

        if (part1 < part2) {
            return -1
        } else if (part1 > part2) {
            return 1
        }
    }

    return 0
}

export const isVersionCompatible = (
    version: string,
    minimumVersion: string
): boolean => {
    return compareVersions(version, minimumVersion) >= 0
}
