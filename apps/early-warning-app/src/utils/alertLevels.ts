import type { AlertPolicyRead } from '@dhis2-chap/ui';

const COLORS = ['#fdd835', '#fb8c00', '#e53935', '#b71c1c'];

export const getReviewLevelColors = (policies: AlertPolicyRead[]) => {
    const names = [...new Set(policies.flatMap(policy => (policy.levels ?? []).map(level => level.name)))];
    return Object.fromEntries(names.map((name, index) => [
        name,
        COLORS[Math.min(index, COLORS.length - 1)],
    ]));
};
