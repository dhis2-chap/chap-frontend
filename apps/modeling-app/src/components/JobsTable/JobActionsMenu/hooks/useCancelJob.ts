import i18n from '@dhis2/d2-i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JobDescription, JobsService } from '@dhis2-chap/ui';
import { useAlert } from '@dhis2/app-runtime';
import { JOB_STATUSES } from '../../../../hooks/useJobs';

type Props = {
    onSuccess?: ({ id }: { id: string }) => void;
    onError?: () => void;
};

export const useCancelJob = ({ onSuccess, onError }: Props = {}) => {
    const queryClient = useQueryClient();

    const { show: showSuccessAlert } = useAlert(
        i18n.t('Job cancelled'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to cancel job'),
        { critical: true },
    );

    const {
        mutate: cancelJob,
        isLoading,
        error,
    } = useMutation({
        mutationFn: (jobId: string) => JobsService.cancelJobJobsJobIdCancelPost(jobId),
        onSuccess: (_data, jobId) => {
            // update the job status in the cache without refetching entire list
            queryClient.setQueryData(['jobs'], (oldJobs: JobDescription[] | undefined) => {
                return oldJobs?.map((job) => {
                    if (job.id === jobId) {
                        return { ...job, status: JOB_STATUSES.REVOKED };
                    }
                    return job;
                });
            });
            showSuccessAlert();
            onSuccess?.({ id: jobId });
        },
        onError: () => {
            showErrorAlert();
            onError?.();
        },
    });

    return {
        cancelJob,
        isLoading,
        error,
    };
};
