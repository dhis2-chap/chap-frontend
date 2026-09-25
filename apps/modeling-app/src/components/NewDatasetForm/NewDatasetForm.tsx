import { useMemo, useState } from 'react';
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
import { type DatasetImportSummary, useCreateDataset } from './hooks/useCreateDataset';
import { useInspectDataset } from './hooks/useInspectDataset';
import { SummaryModal } from '../ModelExecutionForm/SummaryModal';
import { NavigationConfirmModal } from '../NavigationConfirmModal';
import { ChapErrorNotice } from '../ChapErrorNotice';
import { ViewJobLogsModal } from '../JobsTable/JobActionsMenu/ViewJobLogsModal';
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { useDhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import { useModels } from '@/hooks/useModels';
import { useDatasets } from '@/hooks/useDatasets';
import { getPreviousDataItems } from './utils/previousDataItems';
import { getMinimumEvaluationPeriods } from '../NewEvaluationForm/hooks/backtestDefaults';
import { countPeriods } from '@/utils/periods';
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
        summary,
        jobId,
        jobStatus,
    } = useCreateDataset(settings);
    const inspection = useInspectDataset(settings);
    const [shownSummary, setShownSummary] = useState<{ title: string; summary: DatasetImportSummary }>();
    const [shownLogsJobId, setShownLogsJobId] = useState<string>();
    const leftOutCount = new Set(summary?.rejected.map(item => item.orgUnit)).size;
    const allLeftOut = !!summary && leftOutCount > 0 && !summary.importedCount;
    const isBusy = isSubmitting || isImporting || hasSucceeded || inspection.isLoading;
    const checkData = methods.handleSubmit(data => inspection.mutate(data, {
        onSuccess: result => setShownSummary({ title: i18n.t('Data check'), summary: result }),
    }));

    const { models, isLoading: isModelsLoading, error: modelsError } = useModels();
    const { suggestions } = useCovariateSuggestions(models);
    const { data: datasets } = useDatasets();
    const previousDataItems = useMemo(() => getPreviousDataItems(datasets ?? []), [datasets]);
    const columns = useFieldArray({ control: methods.control, name: 'columns' });
    const [columnValues, periodType, fromPeriodId, toPeriodId] = useWatch({
        control: methods.control,
        name: ['columns', 'periodType', 'fromPeriodId', 'toPeriodId'],
    });
    const covariateNames = columnValues.map(column => column.covariateName.trim());
    const support = getModelSupport(covariateNames, periodType, models ?? []);
    const periodCount = countPeriods(fromPeriodId, toPeriodId, settings.calendar);
    const minimumEvaluationPeriods = getMinimumEvaluationPeriods(periodType);
    const isTooShortToEvaluate = !!periodCount && !!minimumEvaluationPeriods && periodCount < minimumEvaluationPeriods;

    // Fill unnamed columns before adding new ones, so a suggestion names a row added with "Add column".
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
                                <fieldset className={styles.fields} disabled={isBusy}>
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
                                        previousDataItems={previousDataItems}
                                    />
                                </fieldset>

                                {isTooShortToEvaluate && (
                                    <NoticeBox warning title={i18n.t('Too short to evaluate')} className={styles.notice}>
                                        {i18n.t('This range has {{periodCount}} periods, but an evaluation needs at least {{minimumEvaluationPeriods}}. You can still create the dataset.', {
                                            periodCount,
                                            minimumEvaluationPeriods,
                                        })}
                                    </NoticeBox>
                                )}

                                <div className={styles.buttons}>
                                    <ButtonStrip end>
                                        <Button
                                            secondary
                                            loading={inspection.isLoading}
                                            disabled={isBusy || isSettingsLoading || !!settingsError}
                                            onClick={() => checkData()}
                                            dataTest="dataset-check-button"
                                        >
                                            {i18n.t('Check data')}
                                        </Button>
                                        <Button
                                            primary
                                            type="submit"
                                            icon={<IconArrowRightMulti16 />}
                                            loading={isSubmitting}
                                            disabled={isBusy || isSettingsLoading || !!settingsError}
                                            dataTest="dataset-create-button"
                                        >
                                            {i18n.t('Create dataset')}
                                        </Button>
                                    </ButtonStrip>
                                </div>
                            </form>

                            {!!inspection.error && (
                                <ChapErrorNotice
                                    error={inspection.error}
                                    title={i18n.t('Could not check the data')}
                                    className={styles.notice}
                                />
                            )}

                            {!!error && !allLeftOut && (
                                <ChapErrorNotice
                                    error={error}
                                    title={i18n.t('Could not create dataset')}
                                    className={styles.notice}
                                />
                            )}

                            {!!summary && leftOutCount > 0 && (
                                <NoticeBox
                                    warning={!allLeftOut}
                                    error={allLeftOut}
                                    title={allLeftOut ? i18n.t('Could not create dataset') : i18n.t('Some locations were left out')}
                                    className={styles.notice}
                                >
                                    {allLeftOut
                                        ? i18n.t('Every location is missing data or a shape, so nothing was imported.')
                                        : i18n.t('CHAP left out {{count}} locations because of missing data or shapes.', {
                                                count: leftOutCount,
                                                defaultValue: 'CHAP left out {{count}} location because of missing data or shapes.',
                                                defaultValue_plural: 'CHAP left out {{count}} locations because of missing data or shapes.',
                                            })}
                                    <ButtonStrip className={styles.noticeActions}>
                                        <Button small onClick={() => setShownSummary({ title: i18n.t('Import summary'), summary })}>{i18n.t('View details')}</Button>
                                    </ButtonStrip>
                                </NoticeBox>
                            )}

                            {isImporting && (
                                <NoticeBox title={i18n.t('Creating dataset')} className={styles.notice}>
                                    {i18n.t('The import is running in the background.')}
                                    {jobId && (
                                        <ButtonStrip className={styles.noticeActions}>
                                            <Button small onClick={() => setShownLogsJobId(jobId)}>{i18n.t('View logs')}</Button>
                                        </ButtonStrip>
                                    )}
                                </NoticeBox>
                            )}

                            {hasFailed && (
                                <NoticeBox error title={i18n.t('Dataset creation failed')} className={styles.notice}>
                                    <ButtonStrip>
                                        {jobId && (
                                            <Button small onClick={() => setShownLogsJobId(jobId)}>{i18n.t('View logs')}</Button>
                                        )}
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

            {jobId && shownLogsJobId === jobId && (
                <ViewJobLogsModal
                    jobId={jobId}
                    status={jobStatus}
                    onClose={() => setShownLogsJobId(undefined)}
                />
            )}

            {shownSummary && (
                <SummaryModal
                    title={shownSummary.title}
                    importSummary={shownSummary.summary}
                    orgUnitNames={shownSummary.summary.orgUnitNames}
                    onClose={() => setShownSummary(undefined)}
                />
            )}

            {showConfirmModal && (
                <NavigationConfirmModal
                    onConfirm={handleConfirmNavigation}
                    onCancel={handleCancelNavigation}
                />
            )}
        </>
    );
};
