import i18n from '@dhis2/d2-i18n';
import { FormProvider } from 'react-hook-form';
import { Card } from '@dhis2-chap/ui';
import { Button, ButtonStrip, IconArrowRightMulti16, NoticeBox } from '@dhis2/ui';
import { ModelExecutionFormFields } from '../ModelExecutionForm/ModelExecutionFormFields';
import { ModelExecutionFormValues } from '../ModelExecutionForm/hooks/useModelExecutionFormState';
import { usePredictionFormController } from './hooks/usePredictionFormController';
import styles from './NewPredictionForm.module.css';
import { SummaryModal } from '../ModelExecutionForm/SummaryModal';
import { useNavigationBlocker } from '../../hooks/useNavigationBlocker';
import { NavigationConfirmModal } from '../NavigationConfirmModal';

type NewPredictionFormProps = {
    initialValues?: Partial<ModelExecutionFormValues>;
};

export const NewPredictionForm = ({ initialValues }: NewPredictionFormProps = {}) => {
    const {
        methods,
        handleSubmit,
        handleStartPrediction,
        handleDryRun,
        isSubmitting,
        isValidationLoading,
        importSummary,
        summaryModalOpen,
        closeSummaryModal,
        error,
    } = usePredictionFormController(initialValues);

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
                        <ModelExecutionFormFields
                            methods={methods}
                            onSubmit={handleSubmit}
                            actions={(
                                <div className={styles.buttons}>
                                    <ButtonStrip end>
                                        <Button
                                            type="button"
                                            onClick={handleDryRun}
                                            loading={isValidationLoading}
                                            primary
                                        >
                                            {i18n.t('Start dry run')}
                                        </Button>

                                        <Button
                                            loading={isSubmitting}
                                            onClick={handleStartPrediction}
                                            icon={<IconArrowRightMulti16 />}
                                            disabled={isValidationLoading}
                                            dataTest="prediction-start-button"
                                        >
                                            {i18n.t('Start import')}
                                        </Button>
                                    </ButtonStrip>
                                </div>
                            )}
                        />

                        {!!error && (
                            <NoticeBox
                                error
                                title={i18n.t('There was an error')}
                                className={styles.errorNotice}
                            >
                                {error.message}
                            </NoticeBox>
                        )}

                        {importSummary && summaryModalOpen && (
                            <SummaryModal
                                importSummary={importSummary}
                                periodType={methods.getValues('periodType')}
                                onClose={closeSummaryModal}
                            />
                        )}
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
