import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, CircularLoader, NoticeBox } from '@dhis2/ui';
import { ApiError, BacktestsService, BacktestSpecificationRead, MakeBacktestsResponse } from '@dhis2-chap/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModels } from '../../hooks/useModels';
import { fetchRunnableModel } from '../../hooks/modelsQuery';
import { hasRevisionMismatch } from '../../utils/modelHealth';
import { ModelHealthNotice } from '../../components/ModelHealth/ModelHealth';
import { ModelsSelector } from '../../components/NewEvaluationForm/DatasetEvaluationForm/ModelsSelector';
import { datasetSupportsModel } from '../../components/NewDatasetForm/utils/datasetModels';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { getModelsWithRun, makeBenchmarkRequest } from './benchmarkUtils';
import styles from './BenchmarksPage.module.css';

type Props = {
    specification: BacktestSpecificationRead;
    onClose: () => void;
    onSuccess: (result: MakeBacktestsResponse) => void;
};

export const AddBenchmarkModels = ({ specification, onClose, onSuccess }: Props) => {
    const { models, isLoading, error } = useModels();
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const { dataset } = specification;
    const compatibleModels = models?.filter(model => datasetSupportsModel(dataset.covariates ?? [], dataset.periodType ?? '', model)) ?? [];
    const selectedModels = compatibleModels.filter(model => selectedIds.includes(model.id));
    const modelsWithRun = getModelsWithRun(specification.backtests, selectedModels);
    const mutation = useMutation<MakeBacktestsResponse, ApiError | Error>({
        mutationFn: async () => {
            const runnable = await Promise.all(selectedModels.map(model => fetchRunnableModel(queryClient, model.id)));
            if (!runnable.length || runnable.some(model => !datasetSupportsModel(dataset.covariates ?? [], dataset.periodType ?? '', model))) {
                throw new Error(i18n.t('The selected models are no longer compatible with this dataset. Choose models again.'));
            }
            return BacktestsService.createBacktestsV1AnalyticsCreateBacktestsPost(makeBenchmarkRequest(
                specification,
                runnable.map(model => model.id),
                i18n.t('Benchmark {{id}}', { id: specification.id }),
            ));
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['backtest-specifications'] });
            onSuccess(result);
        },
    });

    return (
        <div className={styles.addModels}>
            <h3 className={styles.cardTitle}>{i18n.t('Add models')}</h3>
            <p>{i18n.t('Run configured models using this benchmark’s dataset and saved backtest parameters.')}</p>
            {isLoading ? <CircularLoader small /> : error ? (
                <ChapErrorNotice error={error} title={i18n.t('Could not load models')} />
            ) : (
                <>
                    <ModelsSelector
                        models={compatibleModels}
                        selectedModels={selectedModels}
                        onChange={selected => setSelectedIds(selected.map(model => model.id))}
                        disabled={mutation.isLoading}
                    />
                    {!compatibleModels.length && (
                        <NoticeBox title={i18n.t('No compatible models')}>
                            {i18n.t('No configured model matches this dataset’s covariates and period type.')}
                        </NoticeBox>
                    )}
                    {modelsWithRun.length > 0 && (
                        <NoticeBox warning title={i18n.t('Already run with this version')}>
                            {i18n.t('{{models}} already have a run in this benchmark with the same model version. Running again adds another row, which is useful for checking how much scores vary between runs.', {
                                count: modelsWithRun.length,
                                models: modelsWithRun.map(model => model.displayName || model.name).join(', '),
                                defaultValue: '{{models}} already has a run in this benchmark with the same model version. Running again adds another row, which is useful for checking how much scores vary between runs.',
                                defaultValue_plural: '{{models}} already have a run in this benchmark with the same model version. Running again adds another row, which is useful for checking how much scores vary between runs.',
                            })}
                        </NoticeBox>
                    )}
                    {selectedModels.map(model => <ModelHealthNotice key={model.id} model={model} />)}
                </>
            )}
            {mutation.error && <ChapErrorNotice error={mutation.error} title={i18n.t('Could not start model runs')} />}
            <ButtonStrip end>
                <Button disabled={mutation.isLoading} onClick={onClose}>{i18n.t('Cancel')}</Button>
                <Button
                    primary
                    loading={mutation.isLoading}
                    disabled={mutation.isLoading || !selectedModels.length || selectedModels.some(hasRevisionMismatch)}
                    onClick={() => mutation.mutate()}
                >
                    {i18n.t('Run models')}
                </Button>
            </ButtonStrip>
        </div>
    );
};
