import { useState } from 'react';
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
    onChange: (models: ModelSpecRead[]) => void;
};

export const ModelsSelector = ({ models, selectedModels, disabled, disabledReason, onChange }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [infoModel, setInfoModel] = useState<ModelSpecRead>();

    const selectButton = (
        <Button
            small
            icon={<IconSettings16 />}
            disabled={!models.length || !!disabledReason || disabled}
            onClick={() => setIsModalOpen(true)}
            dataTest="evaluation-model-select-button"
        >
            {i18n.t('Select models')}
        </Button>
    );

    return (
        <div className={styles.container}>
            <Label>{i18n.t('Models')}</Label>
            {selectedModels.length ? (
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
                    selectedModels={selectedModels}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={onChange}
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
