import { PERIOD_TYPES } from '@dhis2-chap/core';

/**
 * chap-core reports split period facet coordinates as the ISO start date of the
 * period ("2023-10-01"), while the rest of the app names periods by id ("202310").
 * Only monthly datasets can be identified from the start date alone; for anything
 * else the caller has to keep the date rather than show a guessed period name.
 */
export const toSplitPeriodId = (
    splitPeriod: string,
    periodType?: string | null,
): string | undefined => {
    const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(splitPeriod);

    if (!match || periodType?.toUpperCase() !== PERIOD_TYPES.MONTH) {
        return undefined;
    }

    return `${match[1]}${match[2]}`;
};
