import { useModelExecutionFormState, ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useCreatePrediction } from './useCreatePrediction';

export const usePredictionFormController = (initialValues?: Partial<ModelExecutionFormValues>) => {
    const { methods } = useModelExecutionFormState({ initialValues });

    const {
        createPrediction,
        validateAndDryRun,
        validationResult,
        isSubmitting,
        isValidationLoading,
        summaryModalOpen,
        closeSummaryModal,
        error,
    } = useCreatePrediction({
        onSuccess: () => {
            methods.reset();
        },
    });

    const handleSubmit = (data: ModelExecutionFormValues) => createPrediction(data);
    const handleDryRunSubmit = (data: ModelExecutionFormValues) => validateAndDryRun(data);

    const handleStartPrediction = () => {
        methods.handleSubmit(handleSubmit)();
    };

    const handleDryRun = () => {
        methods.handleSubmit(handleDryRunSubmit)();
    };

    return {
        methods,
        handleSubmit,
        handleStartPrediction,
        handleDryRun,
        isSubmitting,
        isValidationLoading,
        importSummary: validationResult,
        summaryModalOpen,
        closeSummaryModal,
        error,
    };
};
