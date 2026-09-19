import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, InputField, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BacktestsService } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { NavigationConfirmModal } from '../NavigationConfirmModal';
import { useDatasets } from '@/hooks/useDatasets';
import { useModels } from '@/hooks/useModels';
import { datasetSupportsModel } from '../CreateDataset/datasetModels';
import styles from '../CreateDataset/CreateDataset.module.css';

type Props = { initialDatasetId?: string };

export const SavedDatasetEvaluation = ({ initialDatasetId = '' }: Props) => {
    const datasets = useDatasets();
    const models = useModels();
    const [datasetId, setDatasetId] = useState(initialDatasetId);
    const [modelId, setModelId] = useState('');
    const [name, setName] = useState('');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const dataset = datasets.data?.find(item => String(item.id) === datasetId);
    const compatibleModels = models.models?.filter(model => dataset && datasetSupportsModel(dataset.covariates ?? [], dataset.periodType ?? '', model)) ?? [];
    const selectedModel = compatibleModels.find(model => model.name === modelId);
    const create = useMutation({
        mutationFn: () => BacktestsService.createBacktestV1AnalyticsCreateBacktestPost({
            name: name.trim(),
            datasetId: dataset!.id!,
            modelId: selectedModel!.name,
            nPeriods: dataset?.periodType?.toLowerCase() === 'week' ? 12 : 3,
            nSplits: 10,
            stride: dataset?.periodType?.toLowerCase() === 'week' ? 4 : 1,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            navigate('/jobs');
        },
    });
    const navigation = useNavigationBlocker({ shouldBlock: !create.isLoading && !!(name || modelId || datasetId !== initialDatasetId) });
    if (datasets.isLoading || models.isLoading) return <CircularLoader />;
    if (datasets.error || models.error) return <NoticeBox error>{i18n.t('Could not load datasets or models')}</NoticeBox>;
    return (
        <>
            <form
                className={styles.form}
                onSubmit={(event) => {
                    event.preventDefault();
                    if (selectedModel && dataset?.id != null && name.trim()) create.mutate();
                }}
            >
                <fieldset className={styles.fields} disabled={create.isLoading}>
                    <InputField required label={i18n.t('Evaluation name')} value={name} onChange={({ value }) => setName(value ?? '')} />
                    <SingleSelectField
                        label={i18n.t('Dataset')}
                        selected={datasetId}
                        onChange={({ selected }) => {
                            setDatasetId(selected);
                            setModelId('');
                        }}
                    >
                        {datasets.data?.filter(dataset => dataset.id != null).map(dataset => <SingleSelectOption key={dataset.id} value={String(dataset.id)} label={dataset.name} />)}
                    </SingleSelectField>
                    <SingleSelectField label={i18n.t('Compatible model')} selected={modelId} onChange={({ selected }) => setModelId(selected)}>
                        {compatibleModels.map(model => <SingleSelectOption key={model.id} value={model.name} label={model.displayName || model.name} />)}
                    </SingleSelectField>
                    {dataset && !compatibleModels.length && <NoticeBox warning>{i18n.t('No configured model matches this dataset’s columns and period type.')}</NoticeBox>}
                    <Button primary type="submit" loading={create.isLoading} disabled={!selectedModel || !name.trim()}>{i18n.t('Create evaluation')}</Button>
                    {!!create.error && <NoticeBox error>{create.error instanceof Error ? create.error.message : i18n.t('Could not create evaluation')}</NoticeBox>}
                </fieldset>
            </form>
            {navigation.showConfirmModal && <NavigationConfirmModal onConfirm={navigation.handleConfirmNavigation} onCancel={navigation.handleCancelNavigation} />}
        </>
    );
};
