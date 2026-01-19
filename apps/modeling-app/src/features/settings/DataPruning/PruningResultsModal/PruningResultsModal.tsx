import React from 'react';
import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
    NoticeBox,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { PruningResult } from '../hooks/useDataPruning';
import styles from './PruningResultsModal.module.css';

interface PruningResultsModalProps {
    results: PruningResult[];
    onClose: () => void;
}

export const PruningResultsModal = ({
    results,
    onClose,
}: PruningResultsModalProps) => {
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const hasFailures = failureCount > 0;

    return (
        <Modal
            onClose={onClose}
            dataTest="pruning-results-modal"
        >
            <ModalTitle>
                {i18n.t('Results')}
            </ModalTitle>
            <ModalContent>
                <div className={styles.modalContent}>
                    {!hasFailures ? (
                        <NoticeBox valid>
                            {i18n.t('All {{count}} data elements were successfully pruned.', { count: successCount })}
                        </NoticeBox>
                    ) : (
                        <>
                            <NoticeBox error>
                                {i18n.t('{{failureCount}} of {{totalCount}} data elements failed to be pruned', {
                                    failureCount,
                                    totalCount: results.length,
                                })}
                            </NoticeBox>

                            <div className={styles.summaryStats}>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>{successCount}</div>
                                    <div className={styles.statLabel}>{i18n.t('Success')}</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>{failureCount}</div>
                                    <div className={styles.statLabel}>{i18n.t('Failed')}</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>{results.length}</div>
                                    <div className={styles.statLabel}>{i18n.t('Total')}</div>
                                </div>
                            </div>

                            <div className={styles.tableContainer}>
                                <DataTable>
                                    <DataTableHead>
                                        <DataTableRow>
                                            <DataTableColumnHeader>
                                                {i18n.t('Data Element')}
                                            </DataTableColumnHeader>
                                            <DataTableColumnHeader>
                                                {i18n.t('Status')}
                                            </DataTableColumnHeader>
                                            <DataTableColumnHeader>
                                                {i18n.t('Error')}
                                            </DataTableColumnHeader>
                                        </DataTableRow>
                                    </DataTableHead>
                                    <DataTableBody>
                                        {results.map(result => (
                                            <DataTableRow key={result.dataElement.id}>
                                                <DataTableCell>
                                                    {result.dataElement.displayName}
                                                </DataTableCell>
                                                <DataTableCell>
                                                    {result.success ? i18n.t('Success') : i18n.t('Failed')}
                                                </DataTableCell>
                                                <DataTableCell>
                                                    {!result.success && result.error ? result.error : '-'}
                                                </DataTableCell>
                                            </DataTableRow>
                                        ))}
                                    </DataTableBody>
                                </DataTable>
                            </div>
                        </>
                    )}
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        secondary
                        dataTest="close-results-button"
                    >
                        {i18n.t('Close')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
