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
import { NavigationConfirmModal } from '../../NavigationConfirmModal';
import { NameInput } from '../../ModelExecutionForm/Sections/NameInput';
import { ChapErrorNotice } from '../../ChapErrorNotice';
import { useDatasets } from '@/hooks/useDatasets';
import { useModels } from '@/hooks/useModels';
import { DatasetOriginFilter, matchesOrigin, useDatasetOriginFilter } from '../../DatasetOriginFilter';
import { datasetSupportsModel } from '../../NewDatasetForm/utils/datasetModels';
import { getBacktestSplitting, getMinimumEvaluationPeriods } from '../hooks/backtestDefaults';
import { countPeriods } from '@/utils/periods';
import styles from './DatasetEvaluationForm.module.css';

const schema = z.object({
    name: z.string().trim().min(1, { message: i18n.t('Name is required') }),
    datasetId: z.string(),
    modelName: z.string(),
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

    const methods = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', datasetId: initialDatasetId, modelName: '' },
    });
    const [datasetId, modelName] = useWatch({ control: methods.control, name: ['datasetId', 'modelName'] });
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
    const selectedModel = compatibleModels.find(model => model.name === modelName);
    const canSubmit = !!selectedModel && !!splitting && !isTooShort && dataset?.id != null;

    const createEvaluation = useMutation<unknown, ApiError, string>({
        mutationFn: name => BacktestsService.createBacktestV1AnalyticsCreateBacktestPost({
            name,
            datasetId: dataset!.id!,
            modelId: selectedModel!.name,
            ...splitting!,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            navigate('/jobs');
        },
    });

    const {
        showConfirmModal,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useNavigationBlocker({
        shouldBlock: !createEvaluation.isLoading && !createEvaluation.isSuccess && methods.formState.isDirty,
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
                            if (canSubmit) {
                                createEvaluation.mutate(name);
                            }
                        })}
                    >
                        <NameInput />

                        <div className={styles.datasetRow}>
                            <SingleSelectField
                                className={styles.datasetField}
                                label={i18n.t('Dataset')}
                                selected={datasetId}
                                onChange={({ selected }) => {
                                    methods.setValue('datasetId', selected, { shouldDirty: true });
                                    methods.setValue('modelName', '', { shouldDirty: true });
                                }}
                            >
                                {datasetOptions.map(item => (
                                    <SingleSelectOption key={item.id} value={String(item.id)} label={item.name} />
                                ))}
                            </SingleSelectField>
                            <DatasetOriginFilter datasets={savedDatasets} dense={false} />
                        </div>

                        <SingleSelectField
                            label={i18n.t('Model')}
                            selected={modelName}
                            disabled={!compatibleModels.length}
                            onChange={({ selected }) => methods.setValue('modelName', selected, { shouldDirty: true })}
                        >
                            {compatibleModels.map(model => (
                                <SingleSelectOption
                                    key={model.id}
                                    value={model.name}
                                    label={model.displayName || model.name}
                                />
                            ))}
                        </SingleSelectField>

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

                        {!!createEvaluation.error && (
                            <ChapErrorNotice
                                error={createEvaluation.error}
                                title={i18n.t('Could not create evaluation')}
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
