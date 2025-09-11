import { ApiError, CrudService, ConfiguredModelDB } from "@dhis2-chap/ui";
import { useAlert } from "@dhis2/app-runtime";
import i18n from "@dhis2/d2-i18n";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Props = {
    onSuccess?: () => void;
    onError?: () => void;
}

type Variables = {
    id: number;
    name: string;
}

export const useRenameModel = ({ onSuccess, onError }: Props = {}) => {
    const queryClient = useQueryClient();

    const { show: showErrorAlert } = useAlert(
        i18n.t('Error renaming model'),
        { critical: true }
    );

    const {
        mutate: renameModel,
        isLoading,
        error,
    } = useMutation<ConfiguredModelDB, ApiError, Variables, unknown>(
        ({ id, name }: Variables) => CrudService.updateModelCrudModelsModelIdPatch(id, { name }),
        {
            onSuccess: (_data: ConfiguredModelDB, _variables: Variables) => {
                queryClient.invalidateQueries({ queryKey: ['models'] });
                onSuccess?.();
            },
            onError: (error) => {
                showErrorAlert();
                // eslint-disable-next-line no-console
                console.log('There was an error renaming the model', error);
                onError?.();
            },
        }
    );

    return {
        renameModel,
        isSubmitting: isLoading,
        error,
    };
};


