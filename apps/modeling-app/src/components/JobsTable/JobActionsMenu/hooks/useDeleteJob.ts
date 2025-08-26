import { useMutation, useQueryClient } from "@tanstack/react-query";
import i18n from "@dhis2/d2-i18n";

import { JobsService } from "@dhis2-chap/ui";
import { useAlert } from "@dhis2/app-runtime";

type Props = {
    onSuccess?: ({ id }: { id: string }) => void;
    onError?: () => void;
}

export const useDeleteJob = ({ onSuccess, onError }: Props = {}) => {
    const queryClient = useQueryClient();
    const { show: showSuccessAlert } = useAlert(
        i18n.t('Job deleted'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to delete job'),
        { success: false },
    );

    const {
        mutate: deleteJob,
        isLoading,
        isError,
        error,
    } = useMutation({
        mutationFn: (id: string) => JobsService.deleteJobJobsJobIdDelete(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            showSuccessAlert();
            onSuccess?.({ id });
        },
        onError: (error) => {
            console.error(error);
            showErrorAlert();
            onError?.();
        },
    });

    return {
        deleteJob,
        isLoading,
        isError,
        error,
    };
};
