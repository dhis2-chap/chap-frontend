import { useModelExecutionFormState, ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useCreateNewBacktest } from './useCreateNewBacktest';
import { useDhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

export const useEvaluationFormController = (initialValues?: Partial<ModelExecutionFormValues>) => {
    const {
        settings: periodSettings,
        isLoading: periodSettingsLoading,
        error: periodSettingsError,
    } = useDhis2PeriodSettings();
    const { methods } = useModelExecutionFormState({ initialValues, periodSettings });

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
        periodSettings,
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

    const handleDownloadRequest = async () => {
        try {
            await methods.handleSubmit(async (data) => {
                await downloadRequest(data);
            })();
        } catch {
            // error is surfaced via the existing error state
        }
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
        periodSettings,
        periodSettingsLoading,
        periodSettingsError,
    };
};
