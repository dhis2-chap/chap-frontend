import { useModelExecutionFormState, ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useCreatePrediction } from './useCreatePrediction';

type UsePredictionFormControllerOptions = {
    predictionSetupId?: number;
    initialValues?: Partial<ModelExecutionFormValues>;
    returnTo?: string;
};

export const usePredictionFormController = ({
    predictionSetupId,
    initialValues,
    returnTo,
}: UsePredictionFormControllerOptions = {}) => {
    const { methods } = useModelExecutionFormState({ initialValues });

    const {
        createPrediction,
        isSubmitting,
        error,
    } = useCreatePrediction({
        predictionSetupId,
        returnTo,
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
