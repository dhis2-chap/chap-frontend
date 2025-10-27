import React from 'react';
import {
    Button,
    ButtonStrip,
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { ModelSpecRead } from '@dhis2-chap/ui';
import { CovariateMapping } from '../../../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { FeatureMappingItem } from '../FeatureMappingItem';
import { useMappingState } from '../hooks';
import styles from './DataMappingModal.module.css';

type Props = {
    model: ModelSpecRead;
    onClose: () => void;
    onConfirm: (targetMapping: CovariateMapping, covariateMappings: CovariateMapping[]) => void;
};

export const DataMappingModal = ({
    model,
    onClose,
    onConfirm,
}: Props) => {
    const {
        localState,
        handleTargetMapping,
        handleCovariateMapping,
        isFormValid,
        getMappingsForSubmission,
        resetCovariateMapping,
    } = useMappingState(model);

    const handleConfirm = () => {
        const mappings = getMappingsForSubmission();
        if (mappings && mappings.targetMapping) {
            onConfirm(mappings.targetMapping, mappings.covariateMappings);
        }
    };

    return (
        <Modal className={styles.dataMappingModal} onClose={onClose}>
            <ModalTitle>{i18n.t('Map Data Items')}</ModalTitle>
            <ModalContent>
                <div className={styles.content}>
                    <p className={styles.modalDescription}>
                        {i18n.t('Map the model features to corresponding data items in DHIS2')}
                    </p>

                    {model.target && (
                        <div className={styles.targetSection}>
                            <h4 className={styles.sectionTitle}>{i18n.t('Target')}</h4>
                            <p className={styles.sectionDescription}>
                                {i18n.t('Map the model target to the corresponding data item in DHIS2')}
                            </p>

                            <FeatureMappingItem
                                feature={model.target}
                                onMapping={handleTargetMapping}
                                existingMapping={localState.targetMapping?.dataItem}
                                onResetField={() => resetCovariateMapping(model.target.name || '')}
                            />
                        </div>
                    )}

                    {model.covariates && model.covariates.length > 0 && (
                        <div className={styles.covariatesSection}>
                            <h4 className={styles.sectionTitle}>Covariates</h4>
                            <p className={styles.sectionDescription}>
                                {i18n.t('Map each model covariate to the corresponding data item in DHIS2')}
                            </p>

                            {model.covariates.map((covariate, index) => (
                                <FeatureMappingItem
                                    key={covariate.name || index}
                                    feature={covariate}
                                    onMapping={handleCovariateMapping}
                                    existingMapping={localState.covariateMappings[covariate.name || '']}
                                    onResetField={() => resetCovariateMapping(covariate.name || '')}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button primary onClick={handleConfirm} disabled={!isFormValid}>
                        {i18n.t('Save')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
