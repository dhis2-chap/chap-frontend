import { useModelExecutionFormState, ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useCreateNewBacktest } from './useCreateNewBacktest';

export const useEvaluationFormController = (initialValues?: Partial<ModelExecutionFormValues>) => {
    const { methods } = useModelExecutionFormState({ initialValues });

    const {
        createNewBacktest,
        validateAndDryRun,
        downloadRequest,
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

    const handleDownloadRequest = () => {
        methods.handleSubmit(data => downloadRequest(data))();
    };

    return {
        methods,
        handleSubmit,
        handleStartJob,
        handleDryRun,
        handleDownloadRequest,
        isSubmitting,
        isValidationLoading,
        importSummary,
        summaryModalOpen,
        closeSummaryModal,
        error,
    };
};
