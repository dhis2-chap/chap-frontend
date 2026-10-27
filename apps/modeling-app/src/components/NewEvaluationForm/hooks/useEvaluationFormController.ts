import { useModelExecutionFormState, ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useCreateNewBacktest } from './useCreateNewBacktest';
import { useDhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import { useWatch } from 'react-hook-form';
import { useModels } from '@/hooks/useModels';
import { getLegacyBacktestParameters } from './backtestDefaults';
import { useForecastHorizonValidation } from './useForecastHorizonValidation';

export const useEvaluationFormController = (initialValues?: Partial<ModelExecutionFormValues>) => {
    const {
        settings: periodSettings,
        isLoading: periodSettingsLoading,
        error: periodSettingsError,
    } = useDhis2PeriodSettings();
    const { methods } = useModelExecutionFormState({ initialValues, periodSettings });
    const { models } = useModels({ includeArchived: true });
    const [modelId, periodType, backtestParameters] = useWatch({
        control: methods.control,
        name: ['modelId', 'periodType', 'backtestParameters'],
    });
    const forecastHorizon = useForecastHorizonValidation(
        models?.filter(model => String(model.id) === modelId) ?? [],
        (backtestParameters ?? getLegacyBacktestParameters(periodType))?.nPeriods,
    );

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

    const handleSubmit = (data: ModelExecutionFormValues) => {
        if (!forecastHorizon.isBlocked) createNewBacktest(data);
    };
    const handleDryRunSubmit = (data: ModelExecutionFormValues) => {
        if (!forecastHorizon.isBlocked) validateAndDryRun(data);
    };

    const handleStartJob = () => {
        methods.handleSubmit(handleSubmit)();
    };

    const handleDryRun = () => {
        methods.handleSubmit(handleDryRunSubmit)();
    };

    const handleDownloadRequest = async () => {
        if (forecastHorizon.isBlocked) return;
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
        forecastHorizon,
    };
};
