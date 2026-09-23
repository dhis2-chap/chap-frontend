import i18n from '@dhis2/d2-i18n';
import { FormProvider, useFieldArray, useWatch } from 'react-hook-form';
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
import { ModelSupport } from './Sections/ModelSupport';
import { EMPTY_COLUMN, useDatasetFormState } from './hooks/useDatasetFormState';
import { useCovariateSuggestions } from './hooks/useCovariateSuggestions';
import { getModelSupport } from './utils/datasetModels';
import { useCreateDataset } from './hooks/useCreateDataset';
import { NavigationConfirmModal } from '../NavigationConfirmModal';
import { ChapErrorNotice } from '../ChapErrorNotice';
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { useDhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import { useModels } from '@/hooks/useModels';
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
    const { models, isLoading: isModelsLoading, error: modelsError } = useModels();
    const { suggestions } = useCovariateSuggestions(models);
    const columns = useFieldArray({ control: methods.control, name: 'columns' });
    const [columnValues, periodType] = useWatch({ control: methods.control, name: ['columns', 'periodType'] });
    const covariateNames = columnValues.map(column => column.covariateName.trim());
    const support = getModelSupport(covariateNames, periodType, models ?? []);

    // Fill unnamed columns before adding new ones, so a suggestion names the empty starter row.
    const addColumns = (names: string[]) => {
        const emptyIndexes = covariateNames.flatMap((name, index) => (name ? [] : [index]));
        const toAdd = names.filter(name => !covariateNames.includes(name));
        toAdd.slice(0, emptyIndexes.length).forEach((name, i) => {
            methods.setValue(`columns.${emptyIndexes[i]}.covariateName`, name, { shouldDirty: true, shouldValidate: true });
        });
        columns.append(toAdd.slice(emptyIndexes.length).map(covariateName => ({ ...EMPTY_COLUMN, covariateName })));
    };

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
                    <Card className={styles.formCard}>
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

                                    <DatasetColumns
                                        columns={columns}
                                        suggestions={suggestions}
                                        onAddColumn={name => addColumns([name])}
                                    />
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

                    <aside className={styles.sidePanel}>
                        <Card>
                            <ModelSupport
                                support={support}
                                isLoading={isModelsLoading}
                                error={modelsError}
                                onAddColumns={addColumns}
                            />
                        </Card>
                    </aside>
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
