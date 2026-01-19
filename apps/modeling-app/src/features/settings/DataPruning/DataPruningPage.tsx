import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, NoticeBox, Card } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useAuthority } from '../../../hooks/useAuthority';
import { DataElementSelector, DataElement } from './DataElementSelector';
import { ConfirmPruningModal } from './ConfirmPruningModal';
import { PruningResultsModal } from './PruningResultsModal';
import { useDataPruning, PruningResult } from './hooks/useDataPruning';
import styles from './DataPruningPage.module.css';

const MAX_DATA_ELEMENTS = 10;

interface DataElementSlot {
    id: string;
    dataElement: DataElement | null;
}

const createEmptySlot = (): DataElementSlot => ({
    id: crypto.randomUUID(),
    dataElement: null,
});

export const DataPruningPage = () => {
    const navigate = useNavigate();
    const { isSuperUser, isLoading: isAuthorityLoading } = useAuthority({ authority: 'ALL' });

    const [slots, setSlots] = useState<DataElementSlot[]>([createEmptySlot()]);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pruningResults, setPruningResults] = useState<PruningResult[] | null>(null);

    const { pruneDataElementsAsync, isPending, reset } = useDataPruning({
        onSuccess: (results) => {
            setPruningResults(results);
            setIsConfirmModalOpen(false);
        },
    });

    const selectedDataElements = useMemo(
        () => slots.filter(slot => slot.dataElement !== null).map(slot => slot.dataElement as DataElement),
        [slots],
    );

    const selectedIds = useMemo(
        () => selectedDataElements.map(de => de.id),
        [selectedDataElements],
    );

    const handleDataElementChange = (slotId: string, dataElement: DataElement | null) => {
        setSlots(prevSlots =>
            prevSlots.map(slot =>
                slot.id === slotId
                    ? { ...slot, dataElement }
                    : slot,
            ),
        );
    };

    const handleAddSlot = () => {
        if (slots.length < MAX_DATA_ELEMENTS) {
            setSlots(prevSlots => [...prevSlots, createEmptySlot()]);
        }
    };

    const handleRemoveSlot = (slotId: string) => {
        if (slots.length > 1) {
            setSlots(prevSlots => prevSlots.filter(slot => slot.id !== slotId));
        }
    };

    const handleCancel = () => {
        navigate('/settings');
    };

    const handleOpenConfirmModal = () => {
        setIsConfirmModalOpen(true);
    };

    const handleCloseConfirmModal = () => {
        setIsConfirmModalOpen(false);
    };

    const handleConfirmPruning = async () => {
        await pruneDataElementsAsync(selectedDataElements);
    };

    const handleCloseResultsModal = () => {
        setPruningResults(null);
        reset();
        setSlots([createEmptySlot()]);
    };

    const isPruneButtonDisabled = selectedDataElements.length === 0;
    const showAddButton = slots.length < MAX_DATA_ELEMENTS;

    if (isAuthorityLoading) {
        return null;
    }

    if (!isSuperUser) {
        return (
            <div className={styles.container}>
                <Card>
                    <div className={styles.accessDenied}>
                        <h2>{i18n.t('Access Denied')}</h2>
                        <p>
                            {i18n.t('You do not have the required authority to access this page. Data pruning operations require ALL authority.')}
                        </p>
                        <Button
                            onClick={() => navigate('/settings')}
                            primary
                        >
                            {i18n.t('Go Back')}
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <NoticeBox
                title={i18n.t('Warning: Destructive Action')}
                error
            >
                {i18n.t('Data pruning will permanently delete ALL data values for the selected data elements across all organisation units and time periods. This action cannot be undone.')}
            </NoticeBox>

            <Card>
                <div className={styles.formContainer}>
                    <div className={styles.header}>
                        <h2>{i18n.t('Select Data Elements to Prune')}</h2>
                        <p className={styles.description}>
                            {i18n.t('Select up to {{max}} data elements whose data values you want to permanently delete.', { max: MAX_DATA_ELEMENTS })}
                        </p>
                    </div>

                    <div className={styles.selectorList}>
                        {slots.map((slot, index) => (
                            <div key={slot.id} className={styles.selectorRow}>
                                <span className={styles.rowNumber}>
                                    {`${index + 1}.`}
                                </span>
                                <DataElementSelector
                                    value={slot.dataElement}
                                    onChange={dataElement => handleDataElementChange(slot.id, dataElement)}
                                    excludeIds={selectedIds.filter(id => id !== slot.dataElement?.id)}
                                    showRemoveButton={slots.length > 1}
                                    onRemove={() => handleRemoveSlot(slot.id)}
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
                            {i18n.t('Add another data element')}
                        </Button>
                    )}

                    <div className={styles.actions}>
                        <Button
                            onClick={handleCancel}
                            secondary
                        >
                            {i18n.t('Cancel')}
                        </Button>
                        <Button
                            onClick={handleOpenConfirmModal}
                            destructive
                            disabled={isPruneButtonDisabled}
                        >
                            {i18n.t('Prune Data')}
                        </Button>
                    </div>
                </div>
            </Card>

            {isConfirmModalOpen && (
                <ConfirmPruningModal
                    dataElements={selectedDataElements}
                    onClose={handleCloseConfirmModal}
                    onConfirm={handleConfirmPruning}
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
