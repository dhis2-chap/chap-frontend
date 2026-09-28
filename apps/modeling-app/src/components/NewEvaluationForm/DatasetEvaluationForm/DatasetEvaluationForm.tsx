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
import { datasetSupportsModel } from '../../NewDatasetForm/utils/datasetModels';
import { getBacktestSplitting, getMinimumEvaluationPeriods } from '../hooks/backtestDefaults';
import { countPeriods } from '@/utils/periods';
import { ModelsSelector } from './ModelsSelector';
import styles from './DatasetEvaluationForm.module.css';

const schema = z.object({
    name: z.string().trim().min(1, { message: i18n.t('Name is required') }),
    datasetId: z.string(),
    modelNames: z.array(z.string()).min(1),
});

type FormValues = z.infer<typeof schema>;

type Props = {
    initialDatasetId?: string;
};

export const DatasetEvaluationForm = ({ initialDatasetId = '' }: Props) => {
    const datasets = useDatasets();
    const { models, isLoading: isModelsLoading, error: modelsError } = useModels();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAvailable: isMultiModelAvailable } = useIsFeatureAvailable(Features.MULTI_MODEL_BACKTESTS);

    const methods = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', datasetId: initialDatasetId, modelNames: [] },
    });
    const [datasetId, modelNames] = useWatch({ control: methods.control, name: ['datasetId', 'modelNames'] });
    const { origin } = useDatasetOriginFilter();

    const dataset = datasets.data?.find(item => String(item.id) === datasetId);
    const savedDatasets = datasets.data?.filter(item => item.id != null) ?? [];
    const datasetOptions = savedDatasets.filter(item => matchesOrigin(item, origin) || item === dataset);
    const splitting = getBacktestSplitting(dataset?.periodType);
    const periodCount = countPeriods(dataset?.firstPeriod, dataset?.lastPeriod);
    const requiredPeriodCount = getMinimumEvaluationPeriods(dataset?.periodType);
    const isTooShort = periodCount != null && !!requiredPeriodCount && periodCount < requiredPeriodCount;
    const compatibleModels = models?.filter(model => (
        dataset && datasetSupportsModel(dataset.covariates ?? [], dataset.periodType ?? '', model)
    )) ?? [];
    const selectedModels = compatibleModels.filter(model => modelNames.includes(model.name));
    const canSubmit = selectedModels.length > 0 && !!splitting && !isTooShort && dataset?.id != null;

    const createEvaluation = useMutation<void, ApiError, string>({
        mutationFn: async (name: string) => {
            const request = { name, datasetId: dataset!.id!, ...splitting! };
            const modelIds = selectedModels.map(model => model.name);
            if (isMultiModelAvailable) {
                await BacktestsService.createBacktestsV1AnalyticsCreateBacktestsPost({ ...request, modelIds });
                return;
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
        onSuccess: () => navigate('/jobs'),
    });

    const {
        showConfirmModal,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useNavigationBlocker({
        shouldBlock: !createEvaluation.isLoading && methods.formState.isDirty,
    });

    if (datasets.isLoading || isModelsLoading) {
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
                    {i18n.t('Save a dataset once and reuse it across evaluations, or import data for this evaluation only.')}
                    <ButtonStrip className={styles.emptyActions}>
                        <Button small primary onClick={() => navigate('/datasets/new')}>
                            {i18n.t('New dataset')}
                        </Button>
                        <Button small secondary onClick={() => navigate('/evaluate/new')}>
                            {i18n.t('Import from DHIS2 instead')}
                        </Button>
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
                        onSubmit={methods.handleSubmit(({ name }) => {
                            if (canSubmit && !createEvaluation.isLoading) {
                                createEvaluation.mutate(name);
                            }
                        })}
                    >
                        <NameInput disabled={createEvaluation.isLoading} />

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

                        <ModelsSelector
                            models={compatibleModels}
                            selectedModels={selectedModels}
                            disabled={createEvaluation.isLoading}
                            disabledReason={dataset ? undefined : i18n.t('Pick a dataset first')}
                            onChange={selected => methods.setValue(
                                'modelNames',
                                selected.map(model => model.name),
                                { shouldDirty: true },
                            )}
                        />

                        {dataset && !compatibleModels.length && (
                            <NoticeBox warning title={i18n.t('No compatible model')}>
                                {i18n.t('No configured model matches this dataset’s covariates and period type.')}
                            </NoticeBox>
                        )}

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
                                    {i18n.t('Start evaluation')}
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
