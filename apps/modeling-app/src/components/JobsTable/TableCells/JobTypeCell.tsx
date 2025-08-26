import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { JOB_TYPES } from '../../../hooks/useJobs';

const labelByJobType = {
    [JOB_TYPES.BACKTEST]: i18n.t('Create evaluation (Legacy)'),
    [JOB_TYPES.CREATE_BACKTEST_WITH_DATA]: i18n.t('Create evaluation'),
    [JOB_TYPES.MAKE_PREDICTION]: i18n.t('Make prediction'),
    [JOB_TYPES.CREATE_DATASET]: i18n.t('Create dataset'),
};

type JobTypeCellProps = {
    jobType: keyof typeof labelByJobType | string;
};

export const JobTypeCell = ({ jobType }: JobTypeCellProps) => {
    const typedJobType = jobType as keyof typeof labelByJobType;
    const label = labelByJobType[typedJobType] || typedJobType;

    return <>{label}</>;
}; 