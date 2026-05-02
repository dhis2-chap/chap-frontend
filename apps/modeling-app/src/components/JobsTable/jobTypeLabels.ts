import i18n from '@dhis2/d2-i18n';
import { JOB_TYPES } from '../../hooks/useJobs';

export const jobTypeLabels: Record<string, string> = {
    [JOB_TYPES.BACKTEST]: i18n.t('Create evaluation (Legacy)'),
    [JOB_TYPES.CREATE_BACKTEST_WITH_DATA]: i18n.t('Create evaluation'),
    [JOB_TYPES.MAKE_PREDICTION]: i18n.t('Make prediction'),
    [JOB_TYPES.CREATE_DATASET]: i18n.t('Create dataset'),
    [JOB_TYPES.XAI_SURROGATE]: i18n.t('XAI surrogate training'),
    [JOB_TYPES.XAI_EXPLANATIONS]: i18n.t('Explanation generation'),
};

export const getJobTypeLabel = (jobType: string): string =>
    jobTypeLabels[jobType] ?? jobType;
