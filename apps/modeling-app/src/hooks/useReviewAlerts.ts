import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertsService, OpenAPI, type AlertRead, type SignalReview } from '@dhis2-chap/ui';
import { useLoggedInUser } from './useLoggedInUser';

// Approves, declines or reopens signals in one request; Chap applies the whole set or none of it.
export const useReviewAlerts = () => {
    const queryClient = useQueryClient();
    const { user, error: userError } = useLoggedInUser();
    const queryKey = ['prediction-alerts', OpenAPI.BASE];
    const mutation = useMutation({
        mutationFn: ({ alertIds, decision }: SignalReview) => {
            if (!user?.username) throw new Error('The signed-in user is not loaded');
            return AlertsService.approveAlertsV1CrudAlertsApprovePost({
                alertIds,
                approved: decision,
                approvedBy: user.username,
            });
        },
        onSuccess: (updatedAlerts) => {
            // Use the saved response immediately, even if refreshing the list subsequently fails.
            const updatedById = new Map(updatedAlerts.map(alert => [alert.id, alert]));
            queryClient.setQueriesData<AlertRead[]>({ queryKey }, alerts => alerts?.map(
                alert => updatedById.get(alert.id) ?? alert,
            ));
        },
        // Also after a failure: a signal removed elsewhere would otherwise fail every retry.
        onSettled: () => queryClient.invalidateQueries({ queryKey }),
    });

    return { ...mutation, isUserLoaded: !!user?.username, userError };
};
