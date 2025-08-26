import React from 'react';
import { StatusIndicator, PillVariant } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import { JOB_STATUSES } from '../../../hooks/useJobs';

const labelByStatus = {
    [JOB_STATUSES.SUCCESS]: i18n.t('Success'),
    [JOB_STATUSES.PENDING]: i18n.t('Pending'),
    [JOB_STATUSES.STARTED]: i18n.t('Running'),
    [JOB_STATUSES.FAILED]: i18n.t('Failed'),
    [JOB_STATUSES.REVOKED]: i18n.t('Cancelled'),
};

const statusToVariant: Record<string, PillVariant> = {
    [JOB_STATUSES.SUCCESS]: 'success',
    [JOB_STATUSES.PENDING]: 'default',
    [JOB_STATUSES.STARTED]: 'info',
    [JOB_STATUSES.FAILED]: 'destructive',
    [JOB_STATUSES.REVOKED]: 'default',
};

const activeByStatus: Record<string, boolean> = {
    [JOB_STATUSES.SUCCESS]: false,
    [JOB_STATUSES.PENDING]: false,
    [JOB_STATUSES.STARTED]: true,
    [JOB_STATUSES.FAILED]: false,
    [JOB_STATUSES.REVOKED]: false,
};

type StatusCellProps = {
    status: keyof typeof labelByStatus | string;
};

export const StatusCell = ({ status }: StatusCellProps) => {
    const typedStatus = status as keyof typeof labelByStatus;
    const label = labelByStatus[typedStatus] || typedStatus;
    const variant = statusToVariant[typedStatus] || 'default';
    const active = activeByStatus[typedStatus] || false;

    return status ? (
        <StatusIndicator
            label={label}
            variant={variant}
            active={active}
        />
    ) : null;
}; 