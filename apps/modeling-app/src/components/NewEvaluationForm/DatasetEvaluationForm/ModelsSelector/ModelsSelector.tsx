import { useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, Chip, IconSettings16, Label, Tooltip } from '@dhis2/ui';
import type { ModelSpecRead } from '@dhis2-chap/ui';
import { toDataTestKey } from '@/utils/dataTestKey';
import { ModelSelectionModal } from '../../../ModelExecutionForm/Sections/ModelSelector/ModelSelectionModal';
import { ViewModelInfoModal } from '../../../PageContent/Models/ModelsTable/ModelActionsMenu/ViewModelInfoModal';
import styles from './ModelsSelector.module.css';

type Props = {
    models: ModelSpecRead[];
    selectedModels: ModelSpecRead[];
    disabled?: boolean;
    disabledReason?: string;
    /** Open the model picker right away instead of waiting for a click on Select models. */
    openOnMount?: boolean;
    /** Called when the picker is closed without confirming a selection. */
    onCancel?: () => void;
    onChange: (models: ModelSpecRead[]) => void;
    /** Marks models already evaluated on this data in the picker. */
    evaluatedIds?: number[];
    /** Leaves the chosen models to the page, which lists them its own way. */
    hideSelection?: boolean;
    /** What is being chosen, where the page offers something more specific than models. */
    label?: string;
    selectLabel?: string;
};

export const ModelsSelector = ({ models, selectedModels, disabled, disabledReason, openOnMount, onCancel, onChange, evaluatedIds, hideSelection, label, selectLabel }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(() => !!openOnMount && models.length > 0 && !disabledReason && !disabled);
    const confirmed = useRef(false);
    const [infoModel, setInfoModel] = useState<ModelSpecRead>();

    const selectButton = (
        <Button
            small
            icon={<IconSettings16 />}
            disabled={!models.length || !!disabledReason || disabled}
            onClick={() => setIsModalOpen(true)}
            dataTest="evaluation-model-select-button"
        >
            {selectLabel ?? i18n.t('Select models')}
        </Button>
    );

    return (
        <div className={styles.container}>
            <Label>{label ?? i18n.t('Models')}</Label>
            {hideSelection ? null : selectedModels.length ? (
                <div className={styles.chips}>
                    {selectedModels.map(model => (
                        <Chip
                            key={model.id}
                            disabled={disabled}
                            onClick={() => setInfoModel(model)}
                            onRemove={() => onChange(selectedModels.filter(({ id }) => id !== model.id))}
                            dataTest={`selected-model-${toDataTestKey(model.name)}`}
                        >
                            {model.displayName || model.name}
                        </Chip>
                    ))}
                </div>
            ) : (
                <p className={styles.mutedText}>{i18n.t('No models selected')}</p>
            )}
            {disabledReason ? (
                <Tooltip content={disabledReason}>{selectButton}</Tooltip>
            ) : selectButton}

            {isModalOpen && (
                <ModelSelectionModal
                    multiple
                    models={models}
                    evaluatedIds={evaluatedIds}
                    selectedModels={selectedModels}
                    onClose={() => {
                        setIsModalOpen(false);
                        if (!confirmed.current) onCancel?.();
                        confirmed.current = false;
                    }}
                    onConfirm={(selected) => {
                        confirmed.current = true;
                        onChange(selected);
                    }}
                />
            )}

            {infoModel && (
                <ViewModelInfoModal
                    id={infoModel.id}
                    sourceUrl={infoModel.sourceUrl}
                    onClose={() => setInfoModel(undefined)}
                />
            )}
        </div>
    );
};
