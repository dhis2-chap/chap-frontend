import i18n from '@dhis2/d2-i18n';
import { AuthorAssessedStatus, ModelSpecRead } from '@dhis2-chap/ui';
import { PillVariant } from '@dhis2-chap/ui';

export type ReadinessConfig = {
    label: string;
    /* one-line, plain-language explanation of what the status means */
    description: string;
    /* solid colour used for dots/accents */
    color: string;
    /* soft background used for chips/badges */
    background: string;
    /* maps onto the shared Pill component variants */
    pillVariant: PillVariant;
    /* lower number == more production-ready, used for default ordering */
    rank: number;
};

export const READINESS_BY_STATUS: Record<AuthorAssessedStatus, ReadinessConfig> = {
    [AuthorAssessedStatus.GREEN]: {
        label: i18n.t('Production'),
        description: i18n.t('Approved for general use.'),
        color: '#2e7d32',
        background: '#e8f5e8',
        pillVariant: 'success',
        rank: 0,
    },
    [AuthorAssessedStatus.YELLOW]: {
        label: i18n.t('Testing'),
        description: i18n.t('Prepared for more extensive testing; not yet approved for production.'),
        color: '#f57f17',
        background: '#fffde7',
        pillVariant: 'warning',
        rank: 1,
    },
    [AuthorAssessedStatus.ORANGE]: {
        label: i18n.t('Limited'),
        description: i18n.t('Tested on a small dataset. Requires manual tuning and close monitoring.'),
        color: '#ef6c00',
        background: '#fff3e0',
        pillVariant: 'warning',
        rank: 2,
    },
    [AuthorAssessedStatus.RED]: {
        label: i18n.t('Experimental'),
        description: i18n.t('An early prototype with no formal validation - only for initial experimentation.'),
        color: '#c62828',
        background: '#ffebee',
        pillVariant: 'destructive',
        rank: 3,
    },
    [AuthorAssessedStatus.GRAY]: {
        label: i18n.t('Deprecated'),
        description: i18n.t('This model is not intended for use or has been deprecated.'),
        color: '#666666',
        background: '#f5f5f5',
        pillVariant: 'default',
        rank: 4,
    },
};

export const getReadiness = (model: ModelSpecRead): ReadinessConfig | undefined =>
    model.authorAssessedStatus
        ? READINESS_BY_STATUS[model.authorAssessedStatus]
        : undefined;

const PERIOD_TYPE_LABELS: Record<string, string> = {
    month: i18n.t('Monthly'),
    year: i18n.t('Yearly'),
    week: i18n.t('Weekly'),
    day: i18n.t('Daily'),
    any: i18n.t('Any period'),
};

export const getPeriodLabel = (model: ModelSpecRead): string => {
    const key = model.supportedPeriodType as string | undefined;
    if (!key) {
        return i18n.t('Any period');
    }
    return PERIOD_TYPE_LABELS[key] ?? key;
};

export const getModelName = (model: ModelSpecRead): string =>
    model.displayName || model.name;

export const sortByReadiness = (models: ModelSpecRead[]): ModelSpecRead[] =>
    [...models].sort((a, b) => {
        const rankA = getReadiness(a)?.rank ?? Number.MAX_SAFE_INTEGER;
        const rankB = getReadiness(b)?.rank ?? Number.MAX_SAFE_INTEGER;
        if (rankA !== rankB) {
            return rankA - rankB;
        }
        return getModelName(a).localeCompare(getModelName(b));
    });
