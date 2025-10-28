import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { FormProvider } from 'react-hook-form';
import { Card } from '@dhis2-chap/ui';
import { useEvaluationFormController } from './hooks/useEvaluationFormController';
import { ModelExecutionFormValues } from '../ModelExecutionForm/hooks/useModelExecutionFormState';
import styles from './NewEvaluationForm.module.css';
import { Button, ButtonStrip, IconArrowRightMulti16, NoticeBox } from '@dhis2/ui';
import { ModelExecutionFormFields } from '../ModelExecutionForm/ModelExecutionFormFields';
import { useNavigationBlocker } from '../../hooks/useNavigationBlocker';
import { NavigationConfirmModal } from '../NavigationConfirmModal';
import { SummaryModal } from '../ModelExecutionForm/SummaryModal';

type NewEvaluationFormProps = {
    initialValues?: Partial<ModelExecutionFormValues>;
};

export const NewEvaluationFormComponent = ({ initialValues }: NewEvaluationFormProps = {}) => {
    const {
        methods,
        handleSubmit,
        handleStartJob,
        isSubmitting,
        error,
        importSummary,
        summaryModalOpen,
        closeSummaryModal,
        handleDryRun,
        isValidationLoading,
    } = useEvaluationFormController(initialValues);

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
                            onSubmit={handleSubmit}
                            methods={methods}
                            actions={(
                                <div className={styles.buttons}>
                                    <ButtonStrip end>
                                        <Button
                                            onClick={handleDryRun}
                                            loading={isValidationLoading}
                                            primary
                                        >
                                            {i18n.t('Start dry run')}
                                        </Button>

                                        <Button
                                            loading={isSubmitting}
                                            onClick={handleStartJob}
                                            icon={<IconArrowRightMulti16 />}
                                            disabled={isValidationLoading}
                                        >
                                            {i18n.t('Start import')}
                                        </Button>
                                    </ButtonStrip>
                                </div>
                            )}
                        />

                        {!!error && !importSummary && (
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
