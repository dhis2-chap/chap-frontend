import React, { useState } from 'react';
import {
    Button,
    Label,
    IconSettings16,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import cn from 'classnames';
import { Control, useFormContext, useWatch } from 'react-hook-form';
import { EvaluationFormValues } from '../../hooks/useFormController';
import { useModels } from '../../../../hooks/useModels';
import { ModelSpecRead } from '@dhis2-chap/ui';
import { ModelSelectionModal } from './ModelSelectionModal';
import styles from './ModelSelector.module.css';

type Props = {
    control: Control<EvaluationFormValues>;
};

export const ModelSelector = ({
    control,
}: Props) => {
    const { models, isLoading } = useModels();
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const methods = useFormContext<EvaluationFormValues>();
    const modelId = useWatch({ control, name: 'modelId' });

    const handleModalConfirm = (model: ModelSpecRead) => {
        methods.setValue('modelId', model.id.toString(), { shouldValidate: true, shouldDirty: true });
        methods.resetField('covariateMappings');
        methods.resetField('targetMapping');
        setIsModelModalOpen(false);
    };

    const selectedFormModel = models?.find(model => model.id.toString() === modelId);

    return (
        <>
            <div className={cn(styles.formField, styles.modelSelector)}>
                <Label>{i18n.t('Model')}</Label>
                {selectedFormModel ? (
                    <p className={styles.mutedText}>{selectedFormModel.displayName || selectedFormModel.name}</p>
                ) : (
                    <p className={styles.mutedText}>{i18n.t('No model selected')}</p>
                )}

                <Button
                    onClick={() => setIsModelModalOpen(true)}
                    icon={<IconSettings16 />}
                    dataTest="evaluation-model-select-button"
                    small
                    loading={isLoading}
                >
                    {i18n.t('Select model')}
                </Button>

                {methods.formState.errors.modelId && (
                    <p className={styles.errorText}>{methods.formState.errors.modelId.message}</p>
                )}
            </div>

            {isModelModalOpen && (
                <ModelSelectionModal
                    models={models}
                    selectedModel={selectedFormModel}
                    onClose={() => setIsModelModalOpen(false)}
                    onConfirm={handleModalConfirm}
                />
            )}
        </>
    );
};
