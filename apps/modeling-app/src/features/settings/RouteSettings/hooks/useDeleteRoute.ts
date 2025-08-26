import { useDataEngine } from "@dhis2/app-runtime"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAlert } from "@dhis2/app-service-alerts"
import i18n from "@dhis2/d2-i18n"


type UseDeleteRouteOptions = {
    onSuccess?: () => void
    onError?: (error: unknown) => void
}

export const useDeleteRoute = ({ id, onSuccess, onError }: { id: string } & UseDeleteRouteOptions) => {
    const dataEngine = useDataEngine()
    const queryClient = useQueryClient()

    const { show: showErrorAlert } = useAlert(
        i18n.t("Error deleting route"),
        { critical: true }
    )
    const { show: showSuccessAlert } = useAlert(
        i18n.t("Route deleted successfully"),
        { success: true }
    )

    const DeleteRouteMutation = {
        resource: 'routes',
        id,
        type: 'delete' as const
    }

    const { mutate, isLoading } = useMutation<unknown, Error, void>(
        () => dataEngine.mutate(DeleteRouteMutation),
        {
            onSuccess: () => {
                showSuccessAlert()
                queryClient.invalidateQueries({ queryKey: ['routes'] })
                onSuccess?.()
            },
            onError: (error) => {
                showErrorAlert()
                console.error("Error deleting route:", error)
                onError?.(error)
            }
        }
    )
    
    return {
        deleteRoute: mutate,
        isDeleting: isLoading
    }
}
