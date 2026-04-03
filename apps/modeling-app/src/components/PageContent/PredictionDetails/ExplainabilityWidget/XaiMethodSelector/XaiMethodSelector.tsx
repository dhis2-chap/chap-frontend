import { useState } from 'react';
import { Button, IconSettings16 } from '@dhis2/ui';
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

    return (
        <>
            <div className={styles.selector}>
                <span className={styles.label}>{i18n.t('XAI Method')}</span>
                <span className={styles.value}>
                    {selectedMethod?.displayName ?? selectedMethodName}
                </span>
                <Button
                    small
                    icon={<IconSettings16 />}
                    onClick={() => setIsModalOpen(true)}
                    loading={isLoading}
                >
                    {i18n.t('Change')}
                </Button>
            </div>

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
