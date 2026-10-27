import i18n from '@dhis2/d2-i18n';
import { useAlert } from '@dhis2/app-runtime';
import { Button, Card, CircularLoader, NoticeBox, SingleSelectField, SingleSelectOption, Transfer } from '@dhis2/ui';
import { ApiError, BacktestsService, ModelsService, ModelTemplateRole, SystemService, VisualizationsService, useRoute } from '@dhis2-chap/ui';
import type { Settings } from '@dhis2-chap/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { backtestParametersSchema } from '../NewEvaluationForm/hooks/backtestParameters';
import { sortMetricIds } from '../PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import { ChapErrorNotice } from '../ChapErrorNotice';
import { BacktestDefaultsFields } from './BacktestDefaultsFields';
import styles from './ModelingDefaults.module.css';

const CUSTOM_METRICS_GUIDE_URL = 'https://chap.dhis2.org/chap-modeling-platform/contributor/creating_custom_metrics/';

const settingsSchema = z.object({
    metricSortOrder: z.array(z.string()),
    selectedMetrics: z.array(z.string()).min(1, i18n.t('Select at least one metric')),
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
            <Card>
                <div className={styles.content}>
                    <div className={styles.header}>
                        <h2>{i18n.t('Modeling defaults')}</h2>
                        <p className={styles.description}>{i18n.t('These defaults apply to everyone using this Chap server.')}</p>
                    </div>
                    {routeError ? (
                        <ChapErrorNotice error={routeError} title={i18n.t('Could not load the Chap route')} />
                    ) : routeLoading ? <CircularLoader small /> : !route ? (
                        <NoticeBox>{i18n.t('Configure a Chap route in General settings first.')}</NoticeBox>
                    ) : query.error ? (
                        <ChapErrorNotice error={query.error} title={i18n.t('Could not load modeling defaults')}>
                            {query.error.status === 404 && <p>{i18n.t('This Chap server does not support modeling defaults. Upgrade Chap Core to use these settings.')}</p>}
                            <Button small onClick={() => query.refetch()}>{i18n.t('Retry')}</Button>
                        </ChapErrorNotice>
                    ) : query.data ? <DefaultsForm key={route.url} data={query.data} /> : <CircularLoader small />}
                </div>
            </Card>
        </div>
    );
};

const DefaultsForm = ({ data }: { data: Awaited<ReturnType<typeof loadDefaults>> }) => {
    const form = useForm<ModelingDefaultsValues>({
        defaultValues: data.settings,
        resolver: zodResolver(settingsSchema),
    });
    const { control, handleSubmit, reset, formState: { isDirty } } = form;
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
    const metricOptions = sortMetricIds(data.metrics.map(metric => metric.id), data.metrics)
        .map(id => ({ value: id, label: data.metrics.find(metric => metric.id === id)?.displayName || id }));
    const baselineModels = data.models.filter(model => model.role === ModelTemplateRole.BASELINE);

    return (
        <FormProvider {...form}>
            <form className={styles.form} onSubmit={handleSubmit(values => save.mutate(values))}>
                <section className={styles.section}>
                    <h3>{i18n.t('Metrics')}</h3>
                    <p className={styles.description}>
                        {i18n.t('Selected metrics are shown by default on benchmarks and evaluations, and rank models in the order listed.')}
                        {' '}
                        <a className={styles.link} href={CUSTOM_METRICS_GUIDE_URL} target="_blank" rel="noopener noreferrer">
                            {i18n.t('Learn how to add custom metrics')}
                        </a>
                    </p>
                    <Controller
                        name="selectedMetrics"
                        control={control}
                        render={({ field, fieldState }) => (
                            <>
                                <Transfer
                                    options={metricOptions}
                                    selected={field.value}
                                    enableOrderChange
                                    disabled={save.isLoading}
                                    leftHeader={<span className={styles.transferHeader}>{i18n.t('Available metrics')}</span>}
                                    rightHeader={<span className={styles.transferHeader}>{i18n.t('Selected metrics')}</span>}
                                    onChange={({ selected }) => {
                                        field.onChange(selected);
                                        // Selected metrics rank first; the rest keep their relative order.
                                        const unselected = form.getValues('metricSortOrder').filter(id => !selected.includes(id));
                                        form.setValue('metricSortOrder', [...selected, ...unselected], { shouldDirty: true });
                                    }}
                                    dataTest="default-metrics"
                                />
                                {fieldState.error && <p className={styles.error}>{fieldState.error.message}</p>}
                            </>
                        )}
                    />
                </section>
                <section className={styles.section}>
                    <h3>{i18n.t('Baseline')}</h3>
                    <Controller
                        name="defaultBaselineModel"
                        control={control}
                        render={({ field, fieldState }) => (
                            <SingleSelectField
                                label={i18n.t('Default baseline model')}
                                helpText={i18n.t('Model runs are compared against this baseline.')}
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
                </section>
                <BacktestDefaultsFields name="weeklyBacktestParams" label={i18n.t('Weekly backtest defaults')} parameters={data.parameters} providers={data.providers} disabled={save.isLoading} />
                <BacktestDefaultsFields name="monthlyBacktestParams" label={i18n.t('Monthly backtest defaults')} parameters={data.parameters} providers={data.providers} disabled={save.isLoading} />
                {save.error && <ChapErrorNotice error={save.error} title={i18n.t('Could not save modeling defaults')} />}
                <div className={styles.actions}>
                    <Button
                        secondary
                        disabled={!isDirty || save.isLoading}
                        onClick={() => {
                            reset();
                            save.reset();
                        }}
                    >
                        {i18n.t('Discard changes')}
                    </Button>
                    <Button primary type="submit" disabled={!isDirty || save.isLoading} loading={save.isLoading}>{i18n.t('Save changes')}</Button>
                </div>
            </form>
        </FormProvider>
    );
};
