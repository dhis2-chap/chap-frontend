import i18n from '@dhis2/d2-i18n';
import { AuthorAssessedStatus, PillVariant } from '@dhis2-chap/ui';

export type StatusConfig = {
    label: string;
    description: string;
    pillVariant: PillVariant;
};

export const modelStatusConfig: Record<AuthorAssessedStatus, StatusConfig> = {
    [AuthorAssessedStatus.GRAY]: {
        label: i18n.t('Deprecated'),
        description: i18n.t('This model is not intended for use or has been deprecated.'),
        pillVariant: 'default',
    },
    [AuthorAssessedStatus.RED]: {
        label: i18n.t('Experimental'),
        description: i18n.t('An early prototype with no formal validation - only for initial experimentation.'),
        pillVariant: 'destructive',
    },
    [AuthorAssessedStatus.ORANGE]: {
        label: i18n.t('Limited'),
        description: i18n.t('Tested on a small dataset. Requires manual tuning and close monitoring.'),
        pillVariant: 'warning',
    },
    [AuthorAssessedStatus.YELLOW]: {
        label: i18n.t('Testing'),
        description: i18n.t('Prepared for more extensive testing; not yet approved for production.'),
        pillVariant: 'warning',
    },
    [AuthorAssessedStatus.GREEN]: {
        label: i18n.t('Production'),
        description: i18n.t('Approved for general use.'),
        pillVariant: 'success',
    },
};
