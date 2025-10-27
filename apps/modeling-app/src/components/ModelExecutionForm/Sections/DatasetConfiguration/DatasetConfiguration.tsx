import React, { useState } from 'react';
import {
    Button,
    Label,
    ButtonStrip,
    IconDimensionData16,
    IconVisualizationArea16,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import cn from 'classnames';
import { Control, FieldErrors, useFormContext, useWatch } from 'react-hook-form';
import { ModelExecutionFormValues, CovariateMapping } from '../../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useModels } from '../../../../hooks/useModels';
import { DataMappingModal } from './DataMappingModal';
import { useDatasetValidation } from './useDatasetValidation';
import styles from './DatasetConfiguration.module.css';
import { OrganisationUnit } from '../../../OrganisationUnitSelector/OrganisationUnitSelector';
import { InspectDatasetModal } from '../../../InspectDatasetModal/InspectDatasetModal';
import { PERIOD_TYPES } from '../../../ModelExecutionForm/constants';
import { useInstalledDVVersion } from '../../../../utils/useInstalledDVVersion';
import { ConditionalTooltip } from '../../../ConditionalTooltip';

type Props = {
    control: Control<ModelExecutionFormValues>;
    errors: FieldErrors<ModelExecutionFormValues>;
};

export const DatasetConfiguration = ({
    control,
    errors,
}: Props) => {
    const [isDataMappingModalOpen, setIsDataMappingModalOpen] = useState(false);
    const [isInspectDatasetModalOpen, setIsInspectDatasetModalOpen] = useState(false);
    const methods = useFormContext<ModelExecutionFormValues>();
    const modelId = useWatch({ control, name: 'modelId' });
    const datasetValidation = useDatasetValidation();
    const mappingStatus = datasetValidation.getDetailedValidationSummary();
    const { models } = useModels();
    const { isCompatible: isDVCompatible, isLoading: isDVLoading } = useInstalledDVVersion();

    const selectedModel = models?.find(model => model.id.toString() === modelId);

    const handleModalClose = () => {
        setIsDataMappingModalOpen(false);
    };

    const handleModalConfirm = (targetMapping: CovariateMapping, covariateMappings: CovariateMapping[]) => {
        methods.setValue('targetMapping', targetMapping, { shouldValidate: true, shouldDirty: true });
        methods.setValue('covariateMappings', covariateMappings, { shouldValidate: true, shouldDirty: true });
        setIsDataMappingModalOpen(false);
    };

    const getMappingSummary = () => {
        if (!selectedModel) {
            return i18n.t('No model selected');
        }

        if (mappingStatus.isValid) {
            return i18n.t('All data items mapped');
        }

        return i18n.t('{{mapped}}/{{total}} data items mapped', {
            mapped: mappingStatus.mappedCovariates + (mappingStatus.missingTarget ? 0 : 1),
            total: mappingStatus.totalCovariates + 1,
        });
    };

    return (
        <>
            <div className={cn(styles.formField, styles.datasetConfiguration)}>
                <Label>{i18n.t('Dataset Configuration')}</Label>
                <p className={styles.mutedText}>{getMappingSummary()}</p>

                <ButtonStrip>
                    <Button
                        onClick={() => setIsDataMappingModalOpen(true)}
                        icon={<IconDimensionData16 />}
                        dataTest="evaluation-data-mapping-button"
                        disabled={!selectedModel}
                        small
                    >
                        {i18n.t('Configure sources')}
                    </Button>

                    <ConditionalTooltip
                        enabled={!isDVLoading && !isDVCompatible}
                        content={i18n.t('The Data Visualizer app is not compatible with this feature. Please update to a newer version.')}
                    >
                        <Button
                            small
                            disabled={!selectedModel || !mappingStatus.isValid || !isDVCompatible}
                            icon={<IconVisualizationArea16 />}
                            onClick={() => setIsInspectDatasetModalOpen(true)}
                        >
                            {i18n.t('Inspect dataset')}
                        </Button>
                    </ConditionalTooltip>
                </ButtonStrip>

                {(errors.targetMapping || errors.covariateMappings) && (
                    <p className={styles.errorText}>
                        {
                            i18n.t('Please map all model covariates to valid data items')
                        }
                    </p>
                )}
            </div>

            {isDataMappingModalOpen && selectedModel && (
                <DataMappingModal
                    model={selectedModel}
                    onClose={handleModalClose}
                    onConfirm={handleModalConfirm}
                />
            )}

            {isInspectDatasetModalOpen && (
                <InspectDatasetModal
                    onClose={() => setIsInspectDatasetModalOpen(false)}
                    selectedOrgUnits={methods.getValues('orgUnits') as OrganisationUnit[]}
                    periodType={methods.getValues('periodType') as keyof typeof PERIOD_TYPES}
                    fromDate={methods.getValues('fromDate') as string}
                    toDate={methods.getValues('toDate') as string}
                    covariateMappings={methods.getValues('covariateMappings') as CovariateMapping[]}
                    targetMapping={methods.getValues('targetMapping') as CovariateMapping}
                />
            )}
        </>
    );
};
