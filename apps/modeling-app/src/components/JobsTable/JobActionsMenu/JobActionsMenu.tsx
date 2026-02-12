import { useState } from 'react';
import {
    FlyoutMenu,
    MenuItem,
    IconDelete16,
    IconView16,
    IconMore16,
    IconCopy16,
    IconCheckmark16,
    IconArrowRight16,
    IconUndo16,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';
import { ViewJobLogsModal } from './ViewJobLogsModal/ViewJobLogsModal';
import { DeleteJobModal } from './DeleteJobModal/DeleteJobModal';
import { CancelJobModal } from './CancelJobModal/CancelJobModal';
import { JOB_STATUSES, JOB_TYPES } from '../../../hooks/useJobs';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useAlert } from '@dhis2/app-runtime';
import { useNavigate } from 'react-router-dom';

type Props = {
    jobId: string;
    status: string;
    result: string | undefined | null;
    type: string;
};

export const JobActionsMenu = ({
    jobId,
    status,
    result,
    type,
}: Props) => {
    const navigate = useNavigate();
    const [flyoutMenuIsOpen, setFlyoutMenuIsOpen] = useState(false);
    const [viewLogsModalIsOpen, setViewLogsModalIsOpen] = useState(false);
    const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
    const [cancelModalIsOpen, setCancelModalIsOpen] = useState(false);

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to copy job ID'),
        { success: false },
    );

    const { copy: copyToClipboard, isCopied } = useCopyToClipboard({
        onError: () => showErrorAlert(),
    });

    const handleViewLogs = () => {
        setFlyoutMenuIsOpen(false);
        setViewLogsModalIsOpen(true);
    };

    const handleNavigateToResult = () => {
        if (type === JOB_TYPES.CREATE_BACKTEST_WITH_DATA || type === JOB_TYPES.BACKTEST) {
            navigate(`/evaluate/compare?baseEvaluation=${result}&returnTo=${encodeURIComponent('/jobs')}`);
        } else if (type === JOB_TYPES.MAKE_PREDICTION) {
            navigate(`/predictions/${result}`);
        }
        setFlyoutMenuIsOpen(false);
    };

    return (
        <>
            <OverflowButton
                small
                open={flyoutMenuIsOpen}
                icon={<IconMore16 />}
                onClick={() => {
                    setFlyoutMenuIsOpen(prev => !prev);
                }}
                component={(
                    <FlyoutMenu dense>
                        {status === JOB_STATUSES.SUCCESS && (
                            <MenuItem
                                label={i18n.t('Go to result')}
                                dataTest="job-overflow-go-to-result"
                                disabled={!result}
                                icon={<IconArrowRight16 />}
                                onClick={handleNavigateToResult}
                            />
                        )}

                        {status !== JOB_STATUSES.PENDING && (
                            <MenuItem
                                label={i18n.t('View Logs')}
                                dataTest="job-overflow-view-logs"
                                icon={<IconView16 />}
                                onClick={handleViewLogs}
                            />
                        )}

                        <MenuItem
                            label={i18n.t('Copy Job ID')}
                            dataTest="job-overflow-copy-job-id"
                            icon={isCopied ? <IconCheckmark16 /> : <IconCopy16 />}
                            onClick={() => {
                                copyToClipboard(jobId);
                            }}
                        />

                        {(status === JOB_STATUSES.PENDING || status === JOB_STATUSES.STARTED) && (
                            <MenuItem
                                label={i18n.t('Cancel')}
                                dataTest="job-overflow-cancel"
                                destructive
                                icon={<IconUndo16 />}
                                onClick={() => {
                                    setCancelModalIsOpen(true);
                                    setFlyoutMenuIsOpen(false);
                                }}
                            />
                        )}

                        {(status === JOB_STATUSES.SUCCESS || status === JOB_STATUSES.FAILED || status === JOB_STATUSES.REVOKED) && (
                            <MenuItem
                                label={i18n.t('Delete')}
                                dataTest="job-overflow-delete"
                                destructive
                                icon={<IconDelete16 />}
                                onClick={() => {
                                    setDeleteModalIsOpen(true);
                                    setFlyoutMenuIsOpen(false);
                                }}
                            />
                        )}
                    </FlyoutMenu>
                )}
            />

            {viewLogsModalIsOpen && (
                <ViewJobLogsModal
                    jobId={jobId}
                    status={status}
                    onClose={() => setViewLogsModalIsOpen(false)}
                />
            )}

            {deleteModalIsOpen && (
                <DeleteJobModal
                    id={jobId}
                    onClose={() => setDeleteModalIsOpen(false)}
                />
            )}

            {cancelModalIsOpen && (
                <CancelJobModal
                    id={jobId}
                    onClose={() => setCancelModalIsOpen(false)}
                />
            )}
        </>
    );
};
