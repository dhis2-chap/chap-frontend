import { useModelExecutionFormState, ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useCreatePrediction } from './useCreatePrediction';

export const usePredictionFormController = (initialValues?: Partial<ModelExecutionFormValues>) => {
    const { methods } = useModelExecutionFormState({ initialValues });

    const {
        createPrediction,
        isSubmitting,
        error,
    } = useCreatePrediction({
        onSuccess: () => {
            methods.reset();
        },
    });

    const handleSubmit = (data: ModelExecutionFormValues) => createPrediction(data);
    const handleStartPrediction = () => {
        methods.handleSubmit(handleSubmit)();
    };

    return {
        methods,
        handleSubmit,
        handleStartPrediction,
        isSubmitting,
        error,
    };
};
