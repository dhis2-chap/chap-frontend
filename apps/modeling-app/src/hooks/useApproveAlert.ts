import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertApproval, AlertsService, OpenAPI, type AlertRead } from '@dhis2-chap/ui';
import { useLoggedInUser } from './useLoggedInUser';

export const useApproveAlert = () => {
    const queryClient = useQueryClient();
    const { user, error: userError } = useLoggedInUser();
    const queryKey = ['prediction-alerts', OpenAPI.BASE];
    const mutation = useMutation({
        mutationFn: (alertId: number) => {
            if (!user?.username) throw new Error('The signed-in user is not loaded');
            return AlertsService.approveAlertsV1CrudAlertsApprovePost({
                alertIds: [alertId],
                approved: AlertApproval.APPROVED,
                approvedBy: user.username,
            });
        },
        onSuccess: (updatedAlerts) => {
            // Use the saved response immediately, even if refreshing the list subsequently fails.
            queryClient.setQueriesData<AlertRead[]>({ queryKey }, alerts => alerts?.map(
                alert => updatedAlerts.find(updated => updated.id === alert.id) ?? alert,
            ));
            return queryClient.invalidateQueries({ queryKey });
        },
    });

    return { ...mutation, isUserLoaded: !!user?.username, userError };
};
