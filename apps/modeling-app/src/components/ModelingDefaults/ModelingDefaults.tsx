import i18n from '@dhis2/d2-i18n';
import { useAlert } from '@dhis2/app-runtime';
import { Button, Checkbox, CircularLoader, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { ApiError, BacktestsService, ModelsService, ModelTemplateRole, SystemService, VisualizationsService, useRoute } from '@dhis2-chap/ui';
import type { Settings } from '@dhis2-chap/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { backtestParametersSchema } from '../NewEvaluationForm/hooks/backtestParameters';
import { ChapErrorNotice } from '../ChapErrorNotice';
import { BacktestDefaultsFields } from './BacktestDefaultsFields';
import styles from './ModelingDefaults.module.css';

const settingsSchema = z.object({
    metricSortOrder: z.array(z.string()),
    selectedMetrics: z.array(z.string()),
    defaultBaselineModel: z.string().min(1, i18n.t('Select a baseline model')),
    weeklyBacktestParams: backtestParametersSchema,
    monthlyBacktestParams: backtestParametersSchema,
});

export type ModelingDefaultsValues = z.infer<typeof settingsSchema>;

const loadDefaults = async () => {
    const settings = await SystemService.readSettingsV1SettingsGet();
    const [metrics, models, parameters, providers] = await Promise.all([
        // This catalogue does not depend on an existing backtest.
        VisualizationsService.getAvailableMetricsV1VisualizationMetricsBacktestIdGet(0),
        ModelsService.listModelTemplatesV1CrudModelTemplatesGet(),
        BacktestsService.listBacktestParametersV1AnalyticsBacktestParametersGet(),
        BacktestsService.listFutureWeatherProvidersV1AnalyticsWeatherProvidersGet(),
    ]);
    return { settings, metrics, models, parameters, providers };
};

export const ModelingDefaults = () => {
    const { route, isLoading: routeLoading, error: routeError } = useRoute();
    const query = useQuery<Awaited<ReturnType<typeof loadDefaults>>, ApiError>({
        queryKey: ['modeling-defaults', route?.url],
        queryFn: loadDefaults,
        enabled: !!route,
        // Keep edits stable while the tab is open; reload stored values on reopening.
        staleTime: Infinity,
        cacheTime: 0,
        retry: false,
    });

    return (
        <div className={styles.container}>
            <h2>{i18n.t('Modeling defaults')}</h2>
            <p>{i18n.t('These defaults apply to everyone using this CHAP server.')}</p>
            {routeError ? (
                <ChapErrorNotice error={routeError} title={i18n.t('Could not load the CHAP route')} />
            ) : routeLoading ? <CircularLoader small /> : !route ? (
                <NoticeBox>{i18n.t('Configure a CHAP route in General settings first.')}</NoticeBox>
            ) : query.error ? (
                <ChapErrorNotice error={query.error} title={i18n.t('Could not load modeling defaults')}>
                    {query.error.status === 404 && <p>{i18n.t('This CHAP server does not support modeling defaults. Upgrade CHAP Core to use these settings.')}</p>}
                    <Button small onClick={() => query.refetch()}>{i18n.t('Retry')}</Button>
                </ChapErrorNotice>
            ) : query.data ? <DefaultsForm key={route.url} data={query.data} /> : <CircularLoader small />}
        </div>
    );
};

const DefaultsForm = ({ data }: { data: Awaited<ReturnType<typeof loadDefaults>> }) => {
    const form = useForm<ModelingDefaultsValues>({
        defaultValues: data.settings,
        resolver: zodResolver(settingsSchema),
    });
    const { control, watch, setValue, handleSubmit, reset, formState: { isDirty } } = form;
    const queryClient = useQueryClient();
    const { show: showSaved } = useAlert(i18n.t('Modeling defaults saved'), { success: true });
    const save = useMutation<Settings, ApiError, ModelingDefaultsValues>({
        mutationFn: SystemService.updateSettingsV1SettingsPut,
        onSuccess: (settings) => {
            reset(settings);
            for (const key of ['backtest-parameters', 'evaluation-metric-catalog', 'backtest-specifications']) {
                queryClient.invalidateQueries({ queryKey: [key] });
            }
            showSaved();
        },
    });
    const [sortOrder, selectedMetrics] = watch(['metricSortOrder', 'selectedMetrics']);
    const metricsById = new Map(data.metrics.map(metric => [metric.id, metric]));
    const orderedIds = [...new Set([
        ...sortOrder,
        ...[...data.metrics].sort((a, b) => a.sortOrder - b.sortOrder).map(metric => metric.id),
        ...selectedMetrics,
    ])];
    const baselineModels = data.models.filter(model => model.role === ModelTemplateRole.BASELINE);

    const moveMetric = (index: number, offset: number) => {
        const next = [...orderedIds];
        [next[index], next[index + offset]] = [next[index + offset], next[index]];
        setValue('metricSortOrder', next, { shouldDirty: true });
    };

    return (
        <FormProvider {...form}>
            <form className={styles.form} onSubmit={handleSubmit(values => save.mutate(values))}>
                <fieldset className={styles.section} disabled={save.isLoading}>
                    <legend>{i18n.t('Metrics')}</legend>
                    <p>{i18n.t('Select the metrics to show by default. Move metrics up or down to change their display and ranking order.')}</p>
                    <ol className={styles.metrics}>
                        {orderedIds.map((id, index) => {
                            const label = metricsById.get(id)?.displayName || id;
                            return (
                                <li key={id} className={styles.metric} data-test={`default-metric-${id}`}>
                                    <Checkbox
                                        label={label}
                                        checked={selectedMetrics.includes(id)}
                                        disabled={save.isLoading}
                                        onChange={({ checked }) => setValue('selectedMetrics', checked
                                            ? [...selectedMetrics, id]
                                            : selectedMetrics.filter(metric => metric !== id), { shouldDirty: true })}
                                    />
                                    <div className={styles.actions}>
                                        <Button small disabled={save.isLoading || index === 0} onClick={() => moveMetric(index, -1)} aria-label={i18n.t('Move {{metric}} up', { metric: label })}>
                                            {i18n.t('Up')}
                                        </Button>
                                        <Button small disabled={save.isLoading || index === orderedIds.length - 1} onClick={() => moveMetric(index, 1)} aria-label={i18n.t('Move {{metric}} down', { metric: label })}>
                                            {i18n.t('Down')}
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </fieldset>
                <Controller
                    name="defaultBaselineModel"
                    control={control}
                    render={({ field, fieldState }) => (
                        <SingleSelectField
                            label={i18n.t('Default baseline model')}
                            selected={field.value}
                            onChange={({ selected }) => field.onChange(selected)}
                            onBlur={field.onBlur}
                            disabled={save.isLoading}
                            error={!!fieldState.error}
                            validationText={fieldState.error?.message}
                            dataTest="default-baseline-model"
                        >
                            {!baselineModels.some(model => model.name === field.value) && (
                                <SingleSelectOption value={field.value} label={field.value} />
                            )}
                            {baselineModels.map(model => (
                                <SingleSelectOption key={model.name} value={model.name} label={model.displayName || model.name} />
                            ))}
                        </SingleSelectField>
                    )}
                />
                <BacktestDefaultsFields name="weeklyBacktestParams" label={i18n.t('Weekly backtest defaults')} parameters={data.parameters} providers={data.providers} disabled={save.isLoading} />
                <BacktestDefaultsFields name="monthlyBacktestParams" label={i18n.t('Monthly backtest defaults')} parameters={data.parameters} providers={data.providers} disabled={save.isLoading} />
                {save.error && <ChapErrorNotice error={save.error} title={i18n.t('Could not save modeling defaults')} />}
                <div className={styles.actions}>
                    <Button primary type="submit" disabled={!isDirty || save.isLoading} loading={save.isLoading}>{i18n.t('Save changes')}</Button>
                    <Button
                        disabled={!isDirty || save.isLoading}
                        onClick={() => {
                            reset();
                            save.reset();
                        }}
                    >
                        {i18n.t('Discard changes')}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
};
