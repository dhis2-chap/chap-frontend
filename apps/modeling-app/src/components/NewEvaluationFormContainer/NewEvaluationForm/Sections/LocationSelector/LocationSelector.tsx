import React, { useState } from 'react';
import {
    Button,
    Label,
    IconDimensionOrgUnit16,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import cn from 'classnames';
import { Control, FieldErrors, useWatch } from 'react-hook-form';
import { EvaluationFormValues } from '../../hooks/useFormController';
import {
    getSelectionSummary,
    OrganisationUnit,
} from '../../../../OrganisationUnitSelector';
import { useDataViewRootOrgUnits } from '../../../../../hooks/useDataViewRootOrgUnits';
import { OrganisationUnitSelectionModal } from './OrganisationUnitSelectionModal';
import styles from './LocationSelector.module.css';

type Props = {
    control: Control<EvaluationFormValues>;
    errors: FieldErrors<EvaluationFormValues>;
    onUpdateOrgUnits: (orgUnits: OrganisationUnit[]) => void;
};

export const LocationSelector = ({
    control,
    errors,
    onUpdateOrgUnits,
}: Props) => {
    const selectedOrgUnits = useWatch({ control, name: 'orgUnits' });
    const [isOrgUnitModalOpen, setIsOrgUnitModalOpen] = useState(false);
    const { orgUnits: orgUnitRoots, isLoading: isLoadingOrgUnits } = useDataViewRootOrgUnits();

    const handleModalClose = () => {
        setIsOrgUnitModalOpen(false);
    };

    const handleModalConfirm = (pendingOrgUnits: OrganisationUnit[]) => {
        onUpdateOrgUnits(pendingOrgUnits);
        setIsOrgUnitModalOpen(false);
    };

    return (
        <>
            <div className={cn(styles.formField, styles.orgUnitSelector)}>
                <Label>{i18n.t('Organisation Units')}</Label>
                <p className={styles.mutedText}>{getSelectionSummary(selectedOrgUnits)}</p>
                <Button
                    onClick={() => setIsOrgUnitModalOpen(true)}
                    disabled={isLoadingOrgUnits}
                    loading={isLoadingOrgUnits}
                    icon={<IconDimensionOrgUnit16 />}
                    dataTest="evaluation-org-unit-select-button"
                    small
                >
                    {i18n.t('Select organisation units')}
                </Button>
                {errors.orgUnits && (
                    <p className={styles.errorText}>
                        {errors.orgUnits.message}
                    </p>
                )}
            </div>

            {isOrgUnitModalOpen && (
                <OrganisationUnitSelectionModal
                    orgUnitRoots={orgUnitRoots?.map(unit => unit.id) || []}
                    selectedOrgUnits={selectedOrgUnits}
                    onClose={handleModalClose}
                    onConfirm={handleModalConfirm}
                />
            )}
        </>
    );
};
