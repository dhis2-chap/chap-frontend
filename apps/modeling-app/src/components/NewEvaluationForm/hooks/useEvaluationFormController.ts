import { useModelExecutionFormState, ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useCreateNewBacktest } from './useCreateNewBacktest';

export const useEvaluationFormController = (initialValues?: Partial<ModelExecutionFormValues>) => {
    const { methods } = useModelExecutionFormState({ initialValues });

    const {
        createNewBacktest,
        validateAndDryRun,
        importSummary,
        isSubmitting,
        isValidationLoading,
        summaryModalOpen,
        closeSummaryModal,
        error,
    } = useCreateNewBacktest({
        onSuccess: () => {
            methods.reset();
        },
    });

    const handleSubmit = (data: ModelExecutionFormValues) => createNewBacktest(data);
    const handleDryRunSubmit = (data: ModelExecutionFormValues) => validateAndDryRun(data);

    const handleStartJob = () => {
        methods.handleSubmit(handleSubmit)();
    };

    const handleDryRun = () => {
        methods.handleSubmit(handleDryRunSubmit)();
    };

    return {
        methods,
        handleSubmit,
        handleStartJob,
        handleDryRun,
        isSubmitting,
        isValidationLoading,
        importSummary,
        summaryModalOpen,
        closeSummaryModal,
        error,
    };
};
