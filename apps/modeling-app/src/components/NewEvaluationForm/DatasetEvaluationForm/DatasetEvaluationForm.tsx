import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    IconArrowRightMulti16,
    IconSettings16,
    Label,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { BacktestsService, Card } from '@dhis2-chap/ui';
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
import { getChapErrorMessage } from '@/utils/chapErrors';
import { ModelSelectionModal } from '../../ModelExecutionForm/Sections/ModelSelector/ModelSelectionModal';
import selectorStyles from '../../ModelExecutionForm/Sections/ModelSelector/ModelSelector.module.css';
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
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);

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

    const createEvaluation = useMutation({
        mutationFn: async (name: string) => {
            const results = await Promise.allSettled(selectedModels.map(model =>
                BacktestsService.createBacktestV1AnalyticsCreateBacktestPost({
                    name,
                    datasetId: dataset!.id!,
                    modelId: model.name,
                    ...splitting!,
                }),
            ));
            return selectedModels.map((model, index) => ({ model, result: results[index] }));
        },
        onSuccess: (results) => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            const failedModelNames = results
                .filter(({ result }) => result.status === 'rejected')
                .map(({ model }) => model.name);
            // A retry must not start another job for a model that already succeeded.
            if (failedModelNames.length) {
                methods.setValue('modelNames', failedModelNames, { shouldDirty: true });
            } else {
                methods.reset({ ...methods.getValues(), modelNames: [] });
            }
        },
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

                        <div className={selectorStyles.modelSelector}>
                            <Label>{i18n.t('Models')}</Label>
                            {selectedModels.length ? (
                                <ul className={styles.selectedModels}>
                                    {selectedModels.map(model => (
                                        <li key={model.id}>
                                            <span>{model.displayName || model.name}</span>
                                            <Button
                                                small
                                                disabled={createEvaluation.isLoading}
                                                onClick={() => methods.setValue(
                                                    'modelNames',
                                                    modelNames.filter(name => name !== model.name),
                                                    { shouldDirty: true },
                                                )}
                                            >
                                                {i18n.t('Remove')}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={selectorStyles.mutedText}>{i18n.t('No models selected')}</p>
                            )}
                            <Button
                                small
                                icon={<IconSettings16 />}
                                disabled={!compatibleModels.length || createEvaluation.isLoading}
                                onClick={() => setIsModelModalOpen(true)}
                                dataTest="evaluation-model-select-button"
                            >
                                {i18n.t('Select models')}
                            </Button>
                        </div>

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

                        {createEvaluation.data && (
                            <div className={styles.results} aria-live="polite">
                                {createEvaluation.data.map(({ model, result }) => (
                                    <NoticeBox
                                        key={model.id}
                                        error={result.status === 'rejected'}
                                        title={model.displayName || model.name}
                                    >
                                        {result.status === 'fulfilled'
                                            ? i18n.t('Evaluation job started')
                                            : i18n.t('Could not start evaluation: {{error}}', {
                                                    error: getChapErrorMessage(result.reason),
                                                })}
                                    </NoticeBox>
                                ))}
                                <Button onClick={() => navigate('/jobs')}>
                                    {i18n.t('View jobs')}
                                </Button>
                            </div>
                        )}
                    </form>
                </Card>
            </div>

            {isModelModalOpen && (
                <ModelSelectionModal
                    multiple
                    models={compatibleModels}
                    selectedModels={selectedModels}
                    onClose={() => setIsModelModalOpen(false)}
                    onConfirm={selected => methods.setValue('modelNames', selected.map(model => model.name), {
                        shouldDirty: true,
                    })}
                />
            )}

            {showConfirmModal && (
                <NavigationConfirmModal
                    onConfirm={handleConfirmNavigation}
                    onCancel={handleCancelNavigation}
                />
            )}
        </FormProvider>
    );
};
