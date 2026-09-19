import i18n from '@dhis2/d2-i18n';
import { FormProvider } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Card } from '@dhis2-chap/ui';
import {
    Button,
    ButtonStrip,
    IconArrowRightMulti16,
    NoticeBox,
} from '@dhis2/ui';
import { NameInput } from '../ModelExecutionForm/Sections/NameInput';
import { PeriodSelector } from '../ModelExecutionForm/Sections/PeriodSelector';
import { LocationSelector } from '../ModelExecutionForm/Sections/LocationSelector';
import { DatasetColumns } from './Sections/DatasetColumns';
import { useDatasetFormState } from './hooks/useDatasetFormState';
import { useCreateDataset } from './hooks/useCreateDataset';
import { NavigationConfirmModal } from '../NavigationConfirmModal';
import { ChapErrorNotice } from '../ChapErrorNotice';
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { useDhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import styles from './NewDatasetForm.module.css';

export const NewDatasetForm = () => {
    const { settings, isLoading: isSettingsLoading, error: settingsError } = useDhis2PeriodSettings();
    const methods = useDatasetFormState(settings);
    const {
        createDataset,
        isSubmitting,
        error,
        isImporting,
        hasFailed,
        hasSucceeded,
        retry,
    } = useCreateDataset(settings);

    const {
        showConfirmModal,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useNavigationBlocker({
        shouldBlock: !isSubmitting && !isImporting && !hasSucceeded && methods.formState.isDirty,
    });

    return (
        <>
            <FormProvider {...methods}>
                <div className={styles.container}>
                    <Card>
                        <div className={styles.formWrapper}>
                            <form onSubmit={methods.handleSubmit(data => createDataset(data))}>
                                <fieldset className={styles.fields} disabled={isSubmitting || isImporting || hasSucceeded}>
                                    <NameInput
                                        label={i18n.t('Dataset name')}
                                        placeholder={i18n.t('EWARS data 22-24')}
                                    />

                                    <PeriodSelector
                                        periodSettings={settings}
                                        periodSettingsError={settingsError}
                                        periodSettingsLoading={isSettingsLoading}
                                    />

                                    <LocationSelector />

                                    <DatasetColumns />
                                </fieldset>

                                <div className={styles.buttons}>
                                    <ButtonStrip end>
                                        <Button
                                            primary
                                            type="submit"
                                            icon={<IconArrowRightMulti16 />}
                                            loading={isSubmitting}
                                            disabled={isSubmitting || isImporting || hasSucceeded || isSettingsLoading || !!settingsError}
                                            dataTest="dataset-create-button"
                                        >
                                            {i18n.t('Create dataset')}
                                        </Button>
                                    </ButtonStrip>
                                </div>
                            </form>

                            {!!error && (
                                <ChapErrorNotice
                                    error={error}
                                    title={i18n.t('Could not create dataset')}
                                    className={styles.notice}
                                />
                            )}

                            {isImporting && (
                                <NoticeBox title={i18n.t('Creating dataset')} className={styles.notice}>
                                    {i18n.t('The import is running in the background.')}
                                    {' '}
                                    <Link to="/jobs">{i18n.t('View jobs')}</Link>
                                </NoticeBox>
                            )}

                            {hasFailed && (
                                <NoticeBox error title={i18n.t('Dataset creation failed')} className={styles.notice}>
                                    <ButtonStrip>
                                        <Button small onClick={retry}>{i18n.t('Edit and retry')}</Button>
                                    </ButtonStrip>
                                </NoticeBox>
                            )}

                            {hasSucceeded && (
                                <NoticeBox valid title={i18n.t('Dataset created')} className={styles.notice}>
                                    <Link to="/datasets">{i18n.t('View datasets')}</Link>
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
