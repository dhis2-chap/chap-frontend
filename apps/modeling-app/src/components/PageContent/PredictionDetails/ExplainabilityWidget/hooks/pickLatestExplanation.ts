/** When batch runs or methods are recomputed, the DB can hold multiple rows per (org, period, method). Always use the newest. */
export function pickLatestExplanation<T extends { id?: number | null; computedAt?: string | null }>(rows: T[]): T | undefined {
    if (!rows.length) return undefined;
    return rows.reduce((best, exp) => {
        const eid = exp.id ?? -1;
        const bid = best.id ?? -1;
        if (eid !== bid) return eid > bid ? exp : best;
        const ta = exp.computedAt ?? '';
        const tb = best.computedAt ?? '';
        return ta >= tb ? exp : best;
    });
}
