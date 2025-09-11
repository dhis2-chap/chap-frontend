import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { FormProvider } from 'react-hook-form';
import { NewEvaluationFormComponent } from './NewEvaluationForm.component';
import { Card } from '@dhis2-chap/ui';
import { useFormController } from './hooks/useFormController';
import styles from './NewEvaluationForm.module.css';
import { Button, ButtonStrip, IconArrowLeft16, IconArrowRightMulti16, NoticeBox } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';
import { useNavigationBlocker } from '../../hooks/useNavigationBlocker';
import { NavigationConfirmModal } from '../NavigationConfirmModal';
import { SummaryModal } from './SummaryModal';

export const NewEvaluationForm = () => {
    const navigate = useNavigate();
    const {
        methods,
        onUpdateOrgUnits,
        handleSubmit,
        handleStartJob,
        isSubmitting,
        error,
        importSummary,
        summaryModalOpen,
        closeSummaryModal,
        handleDryRun,
        isValidationLoading,
    } = useFormController();

    const {
        showConfirmModal,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useNavigationBlocker({
        shouldBlock: !isSubmitting && methods.formState.isDirty,
    });

    const handleBackClick = () => {
        navigate('/evaluate');
    };

    return (
        <>
            <Button
                className={styles.backButton}
                small
                icon={<IconArrowLeft16 />}
                onClick={handleBackClick}
            >
                {i18n.t('Back to evaluations')}
            </Button>

            <FormProvider {...methods}>
                <div className={styles.container}>
                    <Card>
                        <NewEvaluationFormComponent
                            onSubmit={handleSubmit}
                            methods={methods}
                            onUpdateOrgUnits={onUpdateOrgUnits}
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
