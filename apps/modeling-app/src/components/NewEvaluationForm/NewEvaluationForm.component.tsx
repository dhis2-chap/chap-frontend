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
        hasNoValidOrgUnits,
        dismissHasNoValidOrgUnits,
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
                            onOrgUnitSelectorOpen={dismissHasNoValidOrgUnits}
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
                                            disabled={isValidationLoading || hasNoValidOrgUnits}
                                        >
                                            {i18n.t('Start import')}
                                        </Button>
                                    </ButtonStrip>
                                </div>
                            )}
                        />

                        {hasNoValidOrgUnits && (
                            <NoticeBox
                                error
                                title={i18n.t('No valid locations')}
                                className={styles.errorNotice}
                            >
                                {i18n.t('None of the selected locations have geometry data. Please select different locations to proceed with the evaluation.')}
                            </NoticeBox>
                        )}

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
