import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { FormProvider } from 'react-hook-form';
import { Card } from '@dhis2-chap/ui';
import { Button, IconArrowRightMulti16, NoticeBox } from '@dhis2/ui';
import { ModelExecutionFormFields } from '../ModelExecutionForm/ModelExecutionFormFields';
import { ModelExecutionFormValues } from '../ModelExecutionForm/hooks/useModelExecutionFormState';
import { usePredictionFormController } from './hooks/usePredictionFormController';

type NewPredictionFormProps = {
    initialValues?: Partial<ModelExecutionFormValues>;
};

export const NewPredictionForm = ({ initialValues }: NewPredictionFormProps = {}) => {
    const {
        methods,
        handleSubmit,
        handleStartPrediction,
        isSubmitting,
        error,
    } = usePredictionFormController(initialValues);

    return (
        <FormProvider {...methods}>
            <Card>
                <ModelExecutionFormFields
                    methods={methods}
                    onSubmit={handleSubmit}
                    actions={(
                        <Button
                            type="button"
                            loading={isSubmitting}
                            onClick={handleStartPrediction}
                            icon={<IconArrowRightMulti16 />}
                            dataTest="prediction-start-button"
                        >
                            {i18n.t('Start Prediction')}
                        </Button>
                    )}
                />

                {!!error && (
                    <NoticeBox
                        error
                        title={i18n.t('There was an error')}
                    >
                        {error.message}
                    </NoticeBox>
                )}
            </Card>
        </FormProvider>
    );
};
