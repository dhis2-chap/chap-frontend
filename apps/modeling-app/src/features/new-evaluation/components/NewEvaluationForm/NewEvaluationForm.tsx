import React, { useState } from 'react';
import styles from './NewEvaluationForm.module.css';
import {
    Button,
    IconArrowRight24,
    IconCross24,
    InputField,
} from '@dhis2/ui';
import DatasetDetails from '../../../dataset-details/DatasetDetails';
import SelectModel from '../../../select-model/SelectModel';
import { AnalyticsService } from '@dhis2-chap/ui';
import { useQueryClient } from '@tanstack/react-query';
interface NewEvaluationFormProps {
    onDrawerClose: () => void;
    datasetIdToEvaluate: number | undefined;
}

const NewEvaluationForm = ({
    onDrawerClose,
    datasetIdToEvaluate,
}: NewEvaluationFormProps) => {
    const queryClient = useQueryClient();
    const [evaluationName, setEvaluationName] = useState<string | undefined>('');
    const [selectedModel, setSelectedModel] = useState<any>(undefined);

    const readyToSubmitEvaluation = (evaluationName && datasetIdToEvaluate && selectedModel);

    const onClickEvaluate = (): any => {
        console.log(
            'should evaluate',
            evaluationName,
            datasetIdToEvaluate,
            selectedModel,
        );
        if (readyToSubmitEvaluation) {
            try {
                const response =
                    AnalyticsService.createBacktestAnalyticsCreateBacktestPost({
                        nPeriods: 3,
                        nSplits: 10,
                        stride: 1,
                        name: evaluationName,
                        datasetId: datasetIdToEvaluate,
                        modelId: selectedModel.name,
                    });

                queryClient.invalidateQueries({ queryKey: ['jobs'] });
                console.log('evaluate response', response);
            } catch {
                alert('There was an unknown error creating the evaluation');
            } finally {
                onDrawerClose();
            }
        }
    };

    return (
        <>
            <div className={styles.formWrapper}>
                <div className={styles.newEvaluationTitle}>
                    <h2>New model evaluation</h2>
                    <Button icon={<IconCross24 />} onClick={onDrawerClose} />
                </div>

                <InputField
                    autoComplete=""
                    label="Evaluation name"
                    value={evaluationName}
                    onChange={e => setEvaluationName(e.value)}
                    helpText="Name your evaluation"
                    placeholder="Example: EWARS evaluation, 2020-2024"
                />

                <DatasetDetails datasetId={datasetIdToEvaluate} />

                <SelectModel
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                />

                <div className={styles.buttons}>
                    <Button
                        primary
                        icon={<IconArrowRight24 />}
                        onClick={onClickEvaluate}
                        disabled={!readyToSubmitEvaluation}
                    >
                        Evaluate
                    </Button>
                </div>
            </div>
        </>
    );
};

export default NewEvaluationForm;
