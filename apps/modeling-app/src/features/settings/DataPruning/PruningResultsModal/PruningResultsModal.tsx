import React from 'react';
import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { IconCheckmark16, IconCross16 } from '@dhis2/ui-icons';
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

    return (
        <Modal
            onClose={onClose}
            dataTest="pruning-results-modal"
        >
            <ModalTitle>
                {i18n.t('Pruning Results')}
            </ModalTitle>
            <ModalContent>
                <div className={styles.summary}>
                    <span className={styles.successCount}>
                        {i18n.t('{{count}} successful', { count: successCount })}
                    </span>
                    {failureCount > 0 && (
                        <span className={styles.failureCount}>
                            {i18n.t('{{count}} failed', { count: failureCount })}
                        </span>
                    )}
                </div>

                <ul className={styles.resultsList}>
                    {results.map(result => (
                        <li
                            key={result.dataElement.id}
                            className={`${styles.resultItem} ${result.success ? styles.success : styles.failure}`}
                        >
                            <span className={styles.icon}>
                                {result.success ? (
                                    <IconCheckmark16 />
                                ) : (
                                    <IconCross16 />
                                )}
                            </span>
                            <div className={styles.resultContent}>
                                <span className={styles.dataElementName}>
                                    {result.dataElement.displayName}
                                </span>
                                {!result.success && result.error && (
                                    <span className={styles.errorMessage}>
                                        {result.error}
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        primary
                        dataTest="close-results-button"
                    >
                        {i18n.t('Close')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
