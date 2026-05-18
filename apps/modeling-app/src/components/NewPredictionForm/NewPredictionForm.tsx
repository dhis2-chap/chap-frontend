import i18n from '@dhis2/d2-i18n';
import { Controller, FormProvider } from 'react-hook-form';
import { Card } from '@dhis2-chap/ui';
import {
    Button,
    ButtonStrip,
    IconArrowRightMulti16,
    InputField,
    NoticeBox,
} from '@dhis2/ui';
import { ModelExecutionFormValues } from '../ModelExecutionForm/hooks/useModelExecutionFormState';
import { usePredictionFormController } from './hooks/usePredictionFormController';
import { PredictionSetupNoticeBox } from './components/PredictionSetupNoticeBox';
import { PeriodSelectionField } from './components/PeriodSelectionField';
import styles from './NewPredictionForm.module.css';
import { useNavigationBlocker } from '../../hooks/useNavigationBlocker';
import { NavigationConfirmModal } from '../NavigationConfirmModal';

type NewPredictionFormProps = {
    predictionSetupId?: number;
    initialValues?: Partial<ModelExecutionFormValues>;
    returnTo?: string;
};

const ContextErrorNotice = ({ message }: { message: string }) => (
    <Card>
        <NoticeBox error title={i18n.t('Cannot run prediction')}>
            {message}
        </NoticeBox>
    </Card>
);

export const NewPredictionForm = ({
    predictionSetupId,
    initialValues,
    returnTo,
}: NewPredictionFormProps = {}) => {
    const {
        methods,
        handleStartPrediction,
        isSubmitting,
        error,
        periodType,
        fromPeriod,
        anchorPeriod,
        isContextReady,
    } = usePredictionFormController({
        predictionSetupId,
        initialValues,
        returnTo,
    });

    const {
        showConfirmModal,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useNavigationBlocker({
        shouldBlock: !isSubmitting && methods.formState.isDirty,
    });

    if (!isContextReady || !periodType || !fromPeriod || !anchorPeriod || !initialValues?.targetMapping) {
        return (
            <div className={styles.container}>
                <ContextErrorNotice
                    message={i18n.t(
                        'Missing prediction setup details. Open the setup configuration and ensure model, period type, training start, and data mappings are configured.',
                    )}
                />
            </div>
        );
    }

    return (
        <>
            <FormProvider {...methods}>
                <div className={styles.container}>
                    <Card>
                        <div className={styles.formContainer}>
                            <PredictionSetupNoticeBox
                                modelId={initialValues.modelId ?? ''}
                                periodType={periodType}
                                fromPeriod={fromPeriod}
                            />

                            <div className={styles.formFields}>
                                <Controller
                                    control={methods.control}
                                    name="name"
                                    render={({ field, fieldState }) => (
                                        <InputField
                                            label={i18n.t('Prediction run name')}
                                            value={field.value}
                                            onChange={({ value }) => field.onChange(value ?? '')}
                                            error={!!fieldState.error}
                                            validationText={fieldState.error?.message}
                                            required
                                            dataTest="prediction-name-input"
                                        />
                                    )}
                                />

                                <PeriodSelectionField
                                    periodType={periodType}
                                    anchorPeriod={anchorPeriod}
                                />
                            </div>

                            <div className={styles.buttons}>
                                <ButtonStrip end>
                                    <Button
                                        loading={isSubmitting}
                                        onClick={handleStartPrediction}
                                        icon={<IconArrowRightMulti16 />}
                                        primary
                                        dataTest="prediction-start-button"
                                    >
                                        {i18n.t('Run prediction')}
                                    </Button>
                                </ButtonStrip>
                            </div>

                            {!!error && (
                                <NoticeBox
                                    error
                                    title={i18n.t('There was an error')}
                                    className={styles.errorNotice}
                                >
                                    {error.message}
                                </NoticeBox>
                            )}
                        </div>
                    </Card>
                </div>
            </FormProvider>

            {showConfirmModal && (
                <NavigationConfirmModal
                    onConfirm={handleConfirmNavigation}
                    onCancel={handleCancelNavigation}
                />
            )}
        </>
    );
};
