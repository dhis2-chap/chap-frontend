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
import {
    type ReadyPredictionFormContext,
    usePredictionFormController,
    useReadyPredictionFormContext,
} from './hooks/usePredictionFormController';
import { PredictionSetupNoticeBox } from './components/PredictionSetupNoticeBox';
import { PeriodSelectionField } from './components/PeriodSelectionField';
import styles from './NewPredictionForm.module.css';
import { useNavigationBlocker } from '../../hooks/useNavigationBlocker';
import { NavigationConfirmModal } from '../NavigationConfirmModal';
import { type Dhis2PeriodSettings, useDhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

type NewPredictionFormProps = {
    predictionSetupId: number;
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

const NewPredictionFormFields = ({
    predictionSetupId,
    context,
    periodSettings,
    returnTo,
}: {
    predictionSetupId: number;
    context: ReadyPredictionFormContext;
    periodSettings: Dhis2PeriodSettings;
    returnTo?: string;
}) => {
    const {
        methods,
        handleStartPrediction,
        isSubmitting,
        error,
        periodType,
        fromPeriod,
        anchorPeriod,
    } = usePredictionFormController({
        predictionSetupId,
        context,
        periodSettings,
        returnTo,
    });

    const {
        showConfirmModal,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useNavigationBlocker({
        shouldBlock: !isSubmitting && methods.formState.isDirty,
    });

    return (
        <>
            <FormProvider {...methods}>
                <div className={styles.container}>
                    <Card>
                        <div className={styles.formContainer}>
                            <PredictionSetupNoticeBox
                                modelId={context.initialValues.modelId}
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
                                    fromPeriod={fromPeriod}
                                    anchorPeriod={anchorPeriod}
                                    periodSettings={periodSettings}
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

const NewPredictionFormReady = ({
    predictionSetupId,
    initialValues,
    returnTo,
}: {
    predictionSetupId: number;
    initialValues: Partial<ModelExecutionFormValues>;
    returnTo?: string;
}) => {
    const {
        settings: periodSettings,
        isLoading: periodSettingsLoading,
        error: periodSettingsError,
    } = useDhis2PeriodSettings();
    const context = useReadyPredictionFormContext(initialValues, periodSettings);

    if (periodSettingsError) {
        return (
            <div className={styles.container}>
                <ContextErrorNotice
                    message={periodSettingsError.message}
                />
            </div>
        );
    }

    if (periodSettingsLoading) {
        return (
            <div className={styles.container}>
                <Card>
                    <NoticeBox title={i18n.t('Loading period settings')}>
                        {i18n.t('Preparing period selection.')}
                    </NoticeBox>
                </Card>
            </div>
        );
    }

    if (!context) {
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
        <NewPredictionFormFields
            predictionSetupId={predictionSetupId}
            context={context}
            periodSettings={periodSettings}
            returnTo={returnTo}
        />
    );
};

export const NewPredictionForm = ({
    predictionSetupId,
    initialValues,
    returnTo,
}: NewPredictionFormProps) => {
    if (!initialValues?.targetMapping) {
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
        <NewPredictionFormReady
            predictionSetupId={predictionSetupId}
            initialValues={initialValues}
            returnTo={returnTo}
        />
    );
};
