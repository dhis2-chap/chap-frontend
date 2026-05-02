import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { type XaiMethodRead } from '@dhis2-chap/ui';
import { XaiMethodSelectionModal } from './XaiMethodSelectionModal';
import styles from './XaiMethodSelector.module.css';

type Props = {
    xaiMethods?: XaiMethodRead[];
    selectedMethodName: string;
    onSelect: (method: XaiMethodRead) => void;
    isLoading?: boolean;
};

export const XaiMethodSelector = ({
    xaiMethods,
    selectedMethodName,
    onSelect,
    isLoading = false,
}: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const selectedMethod = xaiMethods?.find(m => m.name === selectedMethodName);
    const label = selectedMethod?.displayName ?? selectedMethodName;

    return (
        <>
            <button
                type="button"
                className={styles.pill}
                onClick={() => setIsModalOpen(true)}
                disabled={isLoading}
                title={i18n.t('Change XAI method')}
            >
                {label}
                <span className={styles.pillCaret}>▾</span>
            </button>

            {isModalOpen && (
                <XaiMethodSelectionModal
                    xaiMethods={xaiMethods}
                    selectedMethodName={selectedMethodName}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={(method) => {
                        onSelect(method);
                        setIsModalOpen(false);
                    }}
                />
            )}
        </>
    );
};
