import { useModelExecutionFormState, ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useCreatePrediction } from './useCreatePrediction';

type UsePredictionFormControllerOptions = {
    configuredModelWithDataSourceId?: number;
    initialValues?: Partial<ModelExecutionFormValues>;
    returnTo?: string;
};

export const usePredictionFormController = ({
    configuredModelWithDataSourceId,
    initialValues,
    returnTo,
}: UsePredictionFormControllerOptions = {}) => {
    const { methods } = useModelExecutionFormState({ initialValues });

    const {
        createPrediction,
        isSubmitting,
        error,
    } = useCreatePrediction({
        configuredModelWithDataSourceId,
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
