import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    IconArrowRightMulti16,
    InputField,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ApiError, BacktestsService, Card } from '@dhis2-chap/ui';
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { NavigationConfirmModal } from '../../NavigationConfirmModal';
import { ChapErrorNotice } from '../../ChapErrorNotice';
import { useDatasets } from '@/hooks/useDatasets';
import { useModels } from '@/hooks/useModels';
import { datasetSupportsModel } from '../../NewDatasetForm/utils/datasetModels';
import { getBacktestSplitting } from '../hooks/backtestDefaults';
import styles from './DatasetEvaluationForm.module.css';

type Props = {
    initialDatasetId?: string;
};

export const DatasetEvaluationForm = ({ initialDatasetId = '' }: Props) => {
    const datasets = useDatasets();
    const { models, isLoading: isModelsLoading, error: modelsError } = useModels();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [datasetId, setDatasetId] = useState(initialDatasetId);
    const [modelName, setModelName] = useState('');
    const [name, setName] = useState('');

    const dataset = datasets.data?.find(item => String(item.id) === datasetId);
    const splitting = getBacktestSplitting(dataset?.periodType);
    const compatibleModels = models?.filter(model => (
        dataset && datasetSupportsModel(dataset.covariates ?? [], dataset.periodType ?? '', model)
    )) ?? [];
    const selectedModel = compatibleModels.find(model => model.name === modelName);
    const canSubmit = !!selectedModel && !!splitting && dataset?.id != null && !!name.trim();

    const createEvaluation = useMutation<unknown, ApiError>({
        mutationFn: () => BacktestsService.createBacktestV1AnalyticsCreateBacktestPost({
            name: name.trim(),
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
        shouldBlock: !createEvaluation.isLoading && !!(name || modelName || datasetId !== initialDatasetId),
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

    return (
        <>
            <div className={styles.container}>
                <Card>
                    <form
                        className={styles.formWrapper}
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (canSubmit) {
                                createEvaluation.mutate();
                            }
                        }}
                    >
                        <InputField
                            label={i18n.t('Name')}
                            value={name}
                            onChange={({ value }) => setName(value ?? '')}
                            placeholder={i18n.t('EWARS Evaluation 22-24')}
                            required
                        />

                        <SingleSelectField
                            label={i18n.t('Dataset')}
                            selected={datasetId}
                            onChange={({ selected }) => {
                                setDatasetId(selected);
                                setModelName('');
                            }}
                        >
                            {datasets.data?.filter(item => item.id != null).map(item => (
                                <SingleSelectOption key={item.id} value={String(item.id)} label={item.name} />
                            ))}
                        </SingleSelectField>

                        <SingleSelectField
                            label={i18n.t('Model')}
                            selected={modelName}
                            disabled={!compatibleModels.length}
                            onChange={({ selected }) => setModelName(selected)}
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
        </>
    );
};
