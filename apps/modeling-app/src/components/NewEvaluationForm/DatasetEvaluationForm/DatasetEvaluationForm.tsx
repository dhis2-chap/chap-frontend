import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    IconArrowRightMulti16,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ApiError, BacktestsService, Card } from '@dhis2-chap/ui';
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { Features, useIsFeatureAvailable } from '@/hooks/useIsFeatureAvailable';
import { NavigationConfirmModal } from '../../NavigationConfirmModal';
import { NameInput } from '../../ModelExecutionForm/Sections/NameInput';
import { ChapErrorNotice } from '../../ChapErrorNotice';
import { useDatasets } from '@/hooks/useDatasets';
import { useModels } from '@/hooks/useModels';
import { DatasetOriginFilter, matchesOrigin, useDatasetOriginFilter } from '../../DatasetOriginFilter';
import { datasetSupportsModel, getBacktestColumns } from '../../NewDatasetForm/utils/datasetModels';
import { BacktestParameterFields } from '../BacktestParameterFields';
import { backtestParametersSchema } from '../hooks/backtestParameters';
import { getLegacyBacktestParameters, getMinimumEvaluationPeriods } from '../hooks/backtestDefaults';
import { countPeriods } from '@/utils/periods';
import { ModelsSelector } from './ModelsSelector';
import { fetchRunnableModel } from '@/hooks/modelsQuery';
import { hasRevisionMismatch } from '@/utils/modelHealth';
import { ModelHealthNotice } from '../../ModelHealth/ModelHealth';
import styles from './DatasetEvaluationForm.module.css';

const schema = z.object({
    name: z.string().trim().min(1, { message: i18n.t('Name is required') }),
    datasetId: z.string(),
    targetColumn: z.string(),
    backtestParameters: backtestParametersSchema.optional(),
    modelNames: z.array(z.string()).min(1),
});

type FormValues = z.infer<typeof schema>;

type Props = {
    initialDatasetId?: string;
    benchmarkContext?: boolean;
};

export const DatasetEvaluationForm = ({ initialDatasetId = '', benchmarkContext = false }: Props) => {
    const datasets = useDatasets();
    const { models, isLoading: isModelsLoading, error: modelsError } = useModels();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAvailable: isMultiModelAvailable, isLoading: isVersionLoading } = useIsFeatureAvailable(Features.MULTI_MODEL_BACKTESTS);

    const methods = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', datasetId: initialDatasetId, targetColumn: '', modelNames: [] },
    });
    const [datasetId, targetColumn, modelNames, backtestParameters] = useWatch({
        control: methods.control,
        name: ['datasetId', 'targetColumn', 'modelNames', 'backtestParameters'],
    });
    const { origin } = useDatasetOriginFilter();

    const dataset = datasets.data?.find(item => String(item.id) === datasetId);
    const savedDatasets = datasets.data?.filter(item => item.id != null) ?? [];
    const datasetOptions = savedDatasets.filter(item => matchesOrigin(item, origin) || item === dataset);
    const periodCount = countPeriods(dataset?.firstPeriod, dataset?.lastPeriod);
    const requiredPeriodCount = getMinimumEvaluationPeriods(
        dataset?.periodType,
        backtestParameters ?? getLegacyBacktestParameters(dataset?.periodType),
    );
    const isTooShort = periodCount != null && !!requiredPeriodCount && periodCount < requiredPeriodCount;
    const columns = dataset?.covariates ?? [];
    const defaultTargetColumn = columns.includes('disease_cases') ? 'disease_cases' : '';
    const selectedTargetColumn = columns.includes(targetColumn) ? targetColumn : defaultTargetColumn;
    const compatibleModels = models?.filter(model => (
        dataset && selectedTargetColumn &&
        datasetSupportsModel(getBacktestColumns(columns, selectedTargetColumn), dataset.periodType ?? '', model)
    )) ?? [];
    const selectedModels = compatibleModels.filter(model => modelNames.includes(model.name));
    const canSubmit = selectedModels.length > 0 && !!selectedTargetColumn && !selectedModels.some(hasRevisionMismatch) &&
        !!dataset?.periodType && !isTooShort && dataset?.id != null;

    const createEvaluation = useMutation<number | undefined, ApiError | Error, FormValues>({
        mutationFn: async ({ name, backtestParameters }: FormValues) => {
            const runnableModels = await Promise.all(
                selectedModels.map(model => fetchRunnableModel(queryClient, model.id)),
            );
            const request = { name, datasetId: dataset!.id!, targetColumn: selectedTargetColumn, ...(backtestParameters ?? getLegacyBacktestParameters(dataset!.periodType)) };
            const modelIds = runnableModels.map(model => model.name);
            if (isMultiModelAvailable) {
                const { specificationId } = await BacktestsService.createBacktestsV1AnalyticsCreateBacktestsPost({ ...request, modelIds });
                return specificationId;
            }
            // Chap Core < 2.4.0 has no multi-model endpoint: queue one backtest per model,
            // named like the multi-model endpoint does, and keep failed models selected for retry.
            const results = await Promise.allSettled(modelIds.map(modelId => (
                BacktestsService.createBacktestV1AnalyticsCreateBacktestPost({ ...request, name: `${name}/${modelId}`, modelId })
            )));
            const failed = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
            if (failed.length) {
                methods.setValue('modelNames', modelIds.filter((_, index) => results[index].status === 'rejected'));
                throw failed[0].reason;
            }
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
        onSuccess: specificationId => navigate(
            benchmarkContext && specificationId != null ? `/evaluate/benchmarks/${specificationId}` : '/jobs',
        ),
    });

    const {
        showConfirmModal,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useNavigationBlocker({
        shouldBlock: !createEvaluation.isLoading && methods.formState.isDirty,
    });

    if (datasets.isLoading || isModelsLoading || isVersionLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (datasets.error || modelsError) {
        return (
            <div className={styles.container}>
                <ChapErrorNotice
                    error={datasets.error ?? modelsError}
                    title={i18n.t('Error loading datasets or models')}
                />
            </div>
        );
    }

    if (!savedDatasets.length) {
        return (
            <div className={styles.container}>
                <NoticeBox title={i18n.t('No saved datasets yet')}>
                    {benchmarkContext
                        ? i18n.t('Save a dataset first, then return here to run models in a benchmark.')
                        : i18n.t('Save a dataset once and reuse it across evaluations, or import data for this evaluation only.')}
                    <ButtonStrip className={styles.emptyActions}>
                        <Button small primary onClick={() => navigate('/datasets/new')}>
                            {i18n.t('New dataset')}
                        </Button>
                        {!benchmarkContext && (
                            <Button small secondary onClick={() => navigate('/evaluate/new')}>
                                {i18n.t('Import from DHIS2 instead')}
                            </Button>
                        )}
                    </ButtonStrip>
                </NoticeBox>
            </div>
        );
    }

    return (
        <FormProvider {...methods}>
            <div className={styles.container}>
                <Card>
                    <form
                        className={styles.formWrapper}
                        noValidate
                        onSubmit={methods.handleSubmit((values) => {
                            if (canSubmit && !createEvaluation.isLoading) {
                                createEvaluation.mutate(values);
                            }
                        })}
                    >
                        {benchmarkContext && (
                            <NoticeBox title={i18n.t('How benchmarks work')}>
                                {i18n.t('Runs with the same dataset, target column and backtest parameters appear in the same benchmark. The run name labels your model runs; it does not create a separate benchmark.')}
                            </NoticeBox>
                        )}
                        <NameInput
                            disabled={createEvaluation.isLoading}
                            label={benchmarkContext ? i18n.t('Run name') : undefined}
                            placeholder={benchmarkContext ? i18n.t('Benchmark model runs') : undefined}
                        />

                        <div className={styles.datasetRow}>
                            <SingleSelectField
                                className={styles.datasetField}
                                label={i18n.t('Dataset')}
                                selected={datasetId}
                                disabled={createEvaluation.isLoading}
                                dataTest="evaluation-dataset-select"
                                helpText={datasetOptions.length ? undefined : i18n.t('No datasets match the origin filter')}
                                onChange={({ selected }) => {
                                    methods.setValue('datasetId', selected, { shouldDirty: true });
                                    methods.setValue('targetColumn', '', { shouldDirty: true });
                                    methods.setValue('modelNames', [], { shouldDirty: true });
                                    createEvaluation.reset();
                                }}
                            >
                                {datasetOptions.map(item => (
                                    <SingleSelectOption key={item.id} value={String(item.id)} label={item.name} />
                                ))}
                            </SingleSelectField>
                            <DatasetOriginFilter datasets={savedDatasets} dense={false} />
                        </div>

                        <SingleSelectField
                            label={i18n.t('Target column')}
                            helpText={i18n.t('The dataset column the models predict and are scored against.')}
                            selected={selectedTargetColumn}
                            disabled={!dataset || createEvaluation.isLoading}
                            dataTest="evaluation-target-column-select"
                            onChange={({ selected }) => {
                                methods.setValue('targetColumn', selected, { shouldDirty: true });
                                createEvaluation.reset();
                            }}
                        >
                            {columns.map(column => (
                                <SingleSelectOption key={column} value={column} label={column} />
                            ))}
                        </SingleSelectField>

                        <ModelsSelector
                            models={compatibleModels}
                            selectedModels={selectedModels}
                            disabled={createEvaluation.isLoading}
                            disabledReason={!dataset ? i18n.t('Pick a dataset first') : !selectedTargetColumn ? i18n.t('Pick a target column first') : undefined}
                            onChange={selected => methods.setValue(
                                'modelNames',
                                selected.map(model => model.name),
                                { shouldDirty: true },
                            )}
                        />

                        {selectedModels.map(model => (
                            <ModelHealthNotice key={model.id} model={model} />
                        ))}

                        {dataset && selectedTargetColumn && !compatibleModels.length && (
                            <NoticeBox warning title={i18n.t('No compatible model')}>
                                {i18n.t('No configured model matches this dataset’s covariates and period type.')}
                            </NoticeBox>
                        )}

                        <BacktestParameterFields disabled={createEvaluation.isLoading} />

                        {isTooShort && (
                            <NoticeBox warning title={i18n.t('Dataset too short')}>
                                {i18n.t('This dataset has {{periodCount}} periods, but an evaluation needs at least {{requiredPeriodCount}}.', {
                                    periodCount,
                                    requiredPeriodCount,
                                })}
                            </NoticeBox>
                        )}

                        <div className={styles.buttons}>
                            <ButtonStrip end>
                                <Button
                                    primary
                                    type="submit"
                                    icon={<IconArrowRightMulti16 />}
                                    loading={createEvaluation.isLoading}
                                    disabled={!canSubmit || createEvaluation.isLoading}
                                >
                                    {benchmarkContext ? i18n.t('Run benchmark') : i18n.t('Start evaluation')}
                                </Button>
                            </ButtonStrip>
                        </div>

                        {createEvaluation.error && (
                            <ChapErrorNotice
                                error={createEvaluation.error}
                                title={i18n.t('Could not start evaluation')}
                            />
                        )}
                    </form>
                </Card>
            </div>

            {showConfirmModal && (
                <NavigationConfirmModal
                    onConfirm={handleConfirmNavigation}
                    onCancel={handleCancelNavigation}
                />
            )}
        </FormProvider>
    );
};
