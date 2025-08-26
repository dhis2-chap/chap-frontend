import { ApiError, BackTestRead, CrudService } from "@dhis2-chap/ui";
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

export const useRenameEvaluation = ({ onSuccess, onError }: Props = {}) => {
    const queryClient = useQueryClient();

    const { show: showErrorAlert } = useAlert(
        i18n.t('Error renaming evaluation'),
        { critical: true }
    );

    const {
        mutate: renameEvaluation,
        isLoading,
        error,
    } = useMutation<BackTestRead, ApiError, Variables, unknown>(
        ({ id, name }: Variables) => CrudService.updateBacktestCrudBacktestsBacktestIdPatch(id, { name }),
        {
            onSuccess: (data: BackTestRead, variables: Variables) => {
                queryClient.setQueryData<BackTestRead[]>(['backtests'], (oldData) =>
                    oldData?.map((backtest) =>
                        backtest.id === variables.id ? { ...backtest, name: variables.name } : backtest
                    )
                );
                onSuccess?.();
            },
            onError: (error) => {
                showErrorAlert();
                console.log('There was an error renaming the evaluation', error);
                onError?.();
            },
        }
    );

    return {
        renameEvaluation,
        isSubmitting: isLoading,
        error,
    };
};
