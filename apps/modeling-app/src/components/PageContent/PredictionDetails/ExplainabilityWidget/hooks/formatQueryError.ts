export const formatQueryError = (e: unknown): string | null =>
    e ? (e instanceof Error ? e.message : String(e)) : null;
