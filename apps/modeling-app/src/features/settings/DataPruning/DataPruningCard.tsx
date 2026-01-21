import React, { useState } from 'react';
import { Button, Card, IconAdd16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthority } from '../../../hooks/useAuthority';
import { DataElementSelector, DataElement } from './DataElementSelector';
import { ConfirmPruningModal } from './ConfirmPruningModal';
import { PruningResultsModal } from './PruningResultsModal';
import { useDataPruning, PruningResult } from './hooks/useDataPruning';
import styles from './DataPruningCard.module.css';

const MAX_DATA_ELEMENTS = 10;

const dataElementSchema = z.object({
    id: z.string().min(1),
    displayName: z.string(),
}).nullable();

const slotSchema = z.object({
    dataElement: dataElementSchema,
});

const dataPruningFormSchema = z.object({
    slots: z
        .array(slotSchema)
        .min(1, { message: i18n.t('At least one slot is required') })
        .max(MAX_DATA_ELEMENTS, { message: i18n.t('Maximum {{max}} data elements allowed', { max: MAX_DATA_ELEMENTS }) }),
});

type DataPruningFormValues = z.infer<typeof dataPruningFormSchema>;

export const DataPruningCard = () => {
    const { isSuperUser, isLoading: isAuthorityLoading } = useAuthority();

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pruningResults, setPruningResults] = useState<PruningResult[] | null>(null);

    const methods = useForm<DataPruningFormValues>({
        resolver: zodResolver(dataPruningFormSchema),
        defaultValues: {
            slots: [{ dataElement: null }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: methods.control,
        name: 'slots',
    });

    const { pruneDataElementsAsync, isPending, reset } = useDataPruning({
        onSuccess: (results) => {
            setPruningResults(results);
            setIsConfirmModalOpen(false);
        },
    });

    const watchedSlots = methods.watch('slots');

    const getSelectedDataElements = (): DataElement[] => {
        return watchedSlots
            .filter(slot => slot.dataElement !== null)
            .map(slot => slot.dataElement as DataElement);
    };

    const getExcludedIds = (currentIndex: number): string[] => {
        return watchedSlots
            .filter((slot, index) => index !== currentIndex && slot.dataElement !== null)
            .map(slot => slot.dataElement!.id);
    };

    const handleAddSlot = () => {
        if (fields.length < MAX_DATA_ELEMENTS) {
            append({ dataElement: null });
        }
    };

    const handleCloseResultsModal = () => {
        setPruningResults(null);
        reset();
        methods.reset({ slots: [{ dataElement: null }] });
    };

    const onSubmit = () => {
        const selectedDataElements = getSelectedDataElements();

        if (selectedDataElements.length === 0) {
            methods.setError('slots', {
                type: 'manual',
                message: i18n.t('Select at least one data element'),
            });
            return;
        }

        setIsConfirmModalOpen(true);
    };

    const selectedDataElements = getSelectedDataElements();
    const isPruneButtonDisabled = selectedDataElements.length === 0;
    const showAddButton = fields.length < MAX_DATA_ELEMENTS;

    if (isAuthorityLoading) {
        return null;
    }

    if (!isSuperUser) {
        return (
            <div className={styles.container}>
                <Card>
                    <div className={styles.accessDenied}>
                        <h2>{i18n.t('Missing authority')}</h2>
                        <p className={styles.mutedText}>
                            {i18n.t('You do not have the required authority to access this page. Data pruning operations requires a superuser authority.')}
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Card>
                <div className={styles.formContainer}>
                    <div className={styles.header}>
                        <h2>{i18n.t('Prune data values')}</h2>
                        <p className={styles.description}>
                            {i18n.t('Select data elements whose data values you want to permanently delete across all organisation units and time periods.', { max: MAX_DATA_ELEMENTS })}
                        </p>
                    </div>

                    <div className={styles.selectorList}>
                        {fields.map((field, index) => (
                            <div key={field.id} className={styles.selectorRow}>
                                <Controller
                                    name={`slots.${index}.dataElement`}
                                    control={methods.control}
                                    render={({ field: controllerField }) => (
                                        <DataElementSelector
                                            value={controllerField.value}
                                            onChange={controllerField.onChange}
                                            excludeIds={getExcludedIds(index)}
                                            showRemoveButton={fields.length > 1}
                                            onRemove={() => remove(index)}
                                        />
                                    )}
                                />
                            </div>
                        ))}
                    </div>

                    {showAddButton && (
                        <Button
                            onClick={handleAddSlot}
                            secondary
                            small
                            className={styles.addButton}
                        >
                            <IconAdd16 />
                            {i18n.t('Add another')}
                        </Button>
                    )}

                    <div className={styles.actions}>
                        <Button
                            onClick={onSubmit}
                            destructive
                            disabled={isPruneButtonDisabled}
                        >
                            {i18n.t('Prune values')}
                        </Button>
                    </div>
                </div>
            </Card>

            {isConfirmModalOpen && (
                <ConfirmPruningModal
                    dataElements={selectedDataElements}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={() => pruneDataElementsAsync(selectedDataElements)}
                    isPending={isPending}
                />
            )}

            {pruningResults && (
                <PruningResultsModal
                    results={pruningResults}
                    onClose={handleCloseResultsModal}
                />
            )}
        </div>
    );
};
