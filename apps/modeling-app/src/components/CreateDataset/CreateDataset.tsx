import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, CircularLoader, InputField, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { DatasetsService, getCovariateNames, JobsService, PeriodRangeField } from '@dhis2-chap/ui';
import { useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { comparePeriodIds, getLastCompletedPeriodId } from '@dhis2-chap/core';
import { Link } from 'react-router-dom';
import { useDhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import { useDataViewRootOrgUnits } from '@/hooks/useDataViewRootOrgUnits';
import { useModels } from '@/hooks/useModels';
import { useModelTemplates } from '@/hooks/useModelTemplates';
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { NavigationConfirmModal } from '../NavigationConfirmModal';
import { OrganisationUnitSelectionModal } from '../ModelExecutionForm/Sections/LocationSelector/OrganisationUnitSelectionModal';
import { getSelectionSummary } from '../OrganisationUnitSelector';
import { SearchSelectField } from '@/features/search-dataitem/SearchSelectField';
import { datasetSchema, DatasetFormValues, prepareDataset } from './prepareDataset';
import { datasetSupportsModel } from './datasetModels';
import styles from './CreateDataset.module.css';

const emptyRow = { name: '', source: 'dhis2', dataElementId: '', displayName: '', dimensionItemType: 'DATA_ELEMENT' as const };

export const CreateDataset = () => {
    const engine = useDataEngine();
    const queryClient = useQueryClient();
    const { settings, isLoading: settingsLoading, error: settingsError } = useDhis2PeriodSettings();
    const roots = useDataViewRootOrgUnits();
    const models = useModels();
    const templates = useModelTemplates();
    const suggestions = useQuery({ queryKey: ['covariateNames'], queryFn: getCovariateNames });
    const sources = useQuery({ queryKey: ['datasetSources'], queryFn: () => DatasetsService.getDataSourcesV1AnalyticsDataSourcesGet() });
    const [selectingUnits, setSelectingUnits] = useState(false);
    const [jobId, setJobId] = useState<string>();
    const form = useForm<DatasetFormValues>({
        resolver: zodResolver(datasetSchema),
        defaultValues: { name: '', periodType: 'MONTH', fromPeriodId: '', toPeriodId: '', orgUnits: [], rows: [{ ...emptyRow, name: 'disease_cases' }] },
    });
    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'rows' });
    const values = form.watch();
    const errors = form.formState.errors;
    const setValue: typeof form.setValue = (name, value) => form.setValue(name, value, { shouldDirty: true, shouldValidate: true });
    const periodType = values.periodType === 'MONTH' ? 'MONTHLY' : 'WEEKLY';
    const maxPeriodId = getLastCompletedPeriodId({ periodType, ...settings });
    const create = useMutation({
        mutationFn: async (data: DatasetFormValues) => {
            if (comparePeriodIds({ a: data.fromPeriodId, b: data.toPeriodId, ...settings }) > 0) {
                throw new Error(i18n.t('End period must be after start period'));
            }
            const request = await prepareDataset(data, engine, settings);
            const result = await DatasetsService.makeDatasetV1AnalyticsMakeDatasetPost(request);
            if (!result.id) throw new Error(i18n.t('Dataset import was rejected'));
            return result;
        },
        onSuccess: (result) => {
            setJobId(result.id!);
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });
    const job = useQuery({
        queryKey: ['datasetJob', jobId],
        queryFn: () => JobsService.getJobStatusV1JobsJobIdGet(jobId!),
        enabled: !!jobId,
        refetchInterval: (status, query) => query.state.status === 'error' || ['SUCCESS', 'FAILURE', 'REVOKED'].includes(status ?? '') ? false : 2000,
    });
    const result = useQuery({
        queryKey: ['datasetJobResult', jobId],
        queryFn: async () => {
            const data = await JobsService.getDatabaseResultV1JobsJobIdDatabaseResultGet(jobId!);
            await queryClient.invalidateQueries({ queryKey: ['datasets'] });
            return data;
        },
        enabled: !!jobId && job.data === 'SUCCESS',
    });
    const navigation = useNavigationBlocker({ shouldBlock: form.formState.isDirty && !jobId });
    const failed = job.data === 'FAILURE' || job.data === 'REVOKED';
    const error = create.error || job.error || result.error;
    const names = values.rows.map(row => row.name.trim()).filter(Boolean);
    const compatibleModels = models.models?.filter(model => datasetSupportsModel(names, values.periodType, model)) ?? [];
    const compatibleTemplates = templates.modelTemplates?.filter(template => template.isLive !== false && datasetSupportsModel(names, values.periodType, template)) ?? [];

    return (
        <>
            <form className={styles.form} onSubmit={form.handleSubmit(data => create.mutate(data))}>
                <fieldset className={styles.fields} disabled={create.isLoading || !!jobId}>
                    <Controller
                        name="name"
                        control={form.control}
                        render={({ field }) => (
                            <InputField label={i18n.t('Dataset name')} required value={field.value} onChange={({ value }) => field.onChange(value)} error={!!errors.name} validationText={errors.name?.message} />
                        )}
                    />
                    <SingleSelectField
                        label={i18n.t('Period type')}
                        selected={values.periodType}
                        onChange={({ selected }) => {
                            setValue('periodType', selected as 'MONTH' | 'WEEK');
                            setValue('fromPeriodId', '');
                            setValue('toPeriodId', '');
                        }}
                    >
                        <SingleSelectOption value="MONTH" label={i18n.t('Monthly')} />
                        <SingleSelectOption value="WEEK" label={i18n.t('Weekly')} />
                    </SingleSelectField>
                    <PeriodRangeField
                        periodType={periodType}
                        {...settings}
                        fromValue={values.fromPeriodId}
                        toValue={values.toPeriodId}
                        maxPeriodId={maxPeriodId}
                        disabled={settingsLoading || !!settingsError}
                        fromError={errors.fromPeriodId?.message}
                        toError={errors.toPeriodId?.message}
                        onFromChange={period => setValue('fromPeriodId', period.id)}
                        onToChange={period => setValue('toPeriodId', period.id)}
                    />
                    <div>
                        <p>{getSelectionSummary(values.orgUnits)}</p>
                        <Button small disabled={roots.isLoading || !!roots.error} onClick={() => setSelectingUnits(true)}>{i18n.t('Select organisation units')}</Button>
                        <p>{i18n.t('GeoJSON is loaded from the selected organisation units.')}</p>
                        {errors.orgUnits && <p role="alert">{errors.orgUnits.message}</p>}
                    </div>
                    <h2>{i18n.t('Data columns')}</h2>
                    <p>{i18n.t('Provide at least one DHIS2 data item. Climate sources use its periods and organisation units.')}</p>
                    {suggestions.isLoading && <CircularLoader small />}
                    {!!suggestions.error && <NoticeBox warning>{i18n.t('Could not load name suggestions. You can still enter covariate names.')}</NoticeBox>}
                    {!!sources.error && <NoticeBox warning>{i18n.t('Could not load climate sources. DHIS2 data items are still available.')}</NoticeBox>}
                    {fields.map((field, index) => {
                        const row = values.rows[index];
                        const suggestion = suggestions.data?.find(item => item.name === row.name.trim());
                        const source = sources.data?.find(item => item.name === row.source);
                        return (
                            <div className={styles.row} key={field.id}>
                                <SingleSelectField
                                    label={i18n.t('Data source')}
                                    selected={row.source}
                                    onChange={({ selected }) => {
                                        setValue(`rows.${index}.source`, selected);
                                        if (selected !== 'dhis2') setValue(`rows.${index}.name`, sources.data?.find(item => item.name === selected)?.supportedFeatures[0] ?? '');
                                    }}
                                >
                                    <SingleSelectOption value="dhis2" label={i18n.t('DHIS2')} />
                                    {sources.data?.map(source => <SingleSelectOption key={source.name} value={source.name} label={source.displayName} />)}
                                </SingleSelectField>
                                {row.source === 'dhis2' && (
                                    <SearchSelectField
                                        feature={{ id: field.id, name: '', displayName: i18n.t('Data item'), description: '' }}
                                        defaultValue={{ id: row.dataElementId, displayName: row.displayName, dimensionItemType: row.dimensionItemType }}
                                        onChangeSearchSelectField={(_, id, displayName, dimensionItemType) => {
                                            setValue(`rows.${index}.dataElementId`, id);
                                            setValue(`rows.${index}.displayName`, displayName);
                                            setValue(`rows.${index}.dimensionItemType`, dimensionItemType);
                                        }}
                                        onResetField={() => setValue(`rows.${index}.dataElementId`, '')}
                                    />
                                )}
                                <label className={styles.nameLabel} htmlFor={`covariate-${field.id}`}>{i18n.t('Covariate name')}</label>
                                <input className={styles.nameInput} id={`covariate-${field.id}`} list={`names-${field.id}`} {...form.register(`rows.${index}.name`)} required aria-describedby={`help-${field.id}`} />
                                <datalist id={`names-${field.id}`}>
                                    {(source ? source.supportedFeatures.map(name => ({ name, standard: false, requiredBy: [] as string[] })) : suggestions.data ?? []).map(item => (
                                        <option key={item.name} value={item.name}>{[item.standard ? i18n.t('Standard') : '', ...item.requiredBy].filter(Boolean).join(' · ')}</option>
                                    ))}
                                </datalist>
                                <div id={`help-${field.id}`}>
                                    {suggestion && (
                                        <p>
                                            {suggestion.standard && i18n.t('Standard name')}
                                            {suggestion.requiredBy.length > 0 && i18n.t(' Required by {{models}}', { models: suggestion.requiredBy.join(', ') })}
                                        </p>
                                    )}
                                    {!!row.name.trim() && suggestions.data && !suggestion && <NoticeBox warning>{i18n.t('This name is not suggested. No current model can consume this column.')}</NoticeBox>}
                                    {source && !source.supportedFeatures.includes(row.name.trim()) && <p role="alert">{i18n.t('Choose a feature supported by this climate source.')}</p>}
                                    {errors.rows?.[index]?.name && <p role="alert">{errors.rows[index]?.name?.message}</p>}
                                </div>
                                <Button small onClick={() => remove(index)}>{i18n.t('Remove column')}</Button>
                            </div>
                        );
                    })}
                    {errors.rows && <p role="alert">{errors.rows.root?.message || errors.rows.message}</p>}
                    <Button small onClick={() => append({ ...emptyRow })}>{i18n.t('Add column')}</Button>
                    <section>
                        <h2>{i18n.t('Compatible models')}</h2>
                        {models.isLoading || templates.isLoading ? <CircularLoader small /> : models.error || templates.error ? (
                            <NoticeBox warning>{i18n.t('Could not check model compatibility.')}</NoticeBox>
                        ) : (
                            <>
                                <p>
                                    {i18n.t('Configured models')}
                                    :
                                    {' '}
                                    {compatibleModels.map(model => model.displayName || model.name).join(', ') || i18n.t('None')}
                                </p>
                                <p>
                                    {i18n.t('Model templates')}
                                    :
                                    {' '}
                                    {compatibleTemplates.map(model => model.displayName || model.name).join(', ') || i18n.t('None')}
                                </p>
                            </>
                        )}
                    </section>
                    {(settingsError || roots.error) && <NoticeBox error>{i18n.t('Could not load period settings or organisation units. Please reload the page.')}</NoticeBox>}
                    <ButtonStrip>
                        <Button primary type="submit" loading={create.isLoading} disabled={settingsLoading || !!settingsError || values.rows.some(row => row.source !== 'dhis2' && !sources.data?.find(source => source.name === row.source)?.supportedFeatures.includes(row.name.trim()))}>{i18n.t('Create dataset')}</Button>
                    </ButtonStrip>
                </fieldset>
                {!!error && <NoticeBox error>{error instanceof Error ? error.message : i18n.t('Dataset creation failed')}</NoticeBox>}
                {failed && (
                    <NoticeBox error>
                        {i18n.t('Dataset creation failed')}
                        <Button
                            small
                            onClick={() => {
                                setJobId(undefined);
                                create.reset();
                            }}
                        >
                            {i18n.t('Edit and retry')}
                        </Button>
                    </NoticeBox>
                )}
                {!!jobId && !failed && !result.data && (
                    <NoticeBox title={i18n.t('Creating dataset')}>
                        <p>{i18n.t('You can follow the import on the jobs page.')}</p>
                        <Link to="/jobs">{i18n.t('View jobs')}</Link>
                    </NoticeBox>
                )}
                {(!!job.error || !!result.error) && <Button small onClick={() => job.error ? job.refetch() : result.refetch()}>{i18n.t('Retry status check')}</Button>}
                {result.data && <NoticeBox title={i18n.t('Dataset created')}><Link to={`/datasets?created=${result.data.id}`}>{i18n.t('View datasets')}</Link></NoticeBox>}
            </form>
            {selectingUnits && (
                <OrganisationUnitSelectionModal
                    orgUnitRoots={roots.orgUnits?.map(unit => unit.id) ?? []}
                    selectedOrgUnits={values.orgUnits}
                    onClose={() => setSelectingUnits(false)}
                    onConfirm={(units) => {
                        setValue('orgUnits', units);
                        setSelectingUnits(false);
                    }}
                />
            )}
            {navigation.showConfirmModal && <NavigationConfirmModal onConfirm={navigation.handleConfirmNavigation} onCancel={navigation.handleCancelNavigation} />}
        </>
    );
};
