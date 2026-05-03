import { useState, useMemo } from 'react';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    Input,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { type XaiMethodRead } from '@dhis2-chap/ui';
import styles from './XaiMethodSelectionModal.module.css';

type Props = {
    xaiMethods?: XaiMethodRead[];
    selectedMethodName: string;
    onClose: () => void;
    onConfirm: (method: XaiMethodRead) => void;
};

export const XaiMethodSelectionModal = ({
    xaiMethods,
    selectedMethodName,
    onClose,
    onConfirm,
}: Props) => {
    const [selectedName, setSelectedName] = useState<string>(selectedMethodName);
    const [searchValue, setSearchValue] = useState('');
    const selected = xaiMethods?.find(m => m.name === selectedName);

    const filteredMethods = useMemo(() => {
        if (!xaiMethods) return [];
        return xaiMethods
            .filter((m) => {
                if (!searchValue) return true;
                const q = searchValue.toLowerCase();
                return m.displayName?.toLowerCase().includes(q)
                    || m.description?.toLowerCase().includes(q);
            })
            .sort((a, b) => {
                if (a.isAuto && !b.isAuto) return -1;
                if (!a.isAuto && b.isAuto) return 1;
                return (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name);
            });
    }, [xaiMethods, searchValue]);

    const autoMethods = filteredMethods.filter(m => m.isAuto);
    const otherMethods = filteredMethods.filter(m => !m.isAuto);

    return (
        <Modal fluid onClose={onClose}>
            <ModalTitle>{i18n.t('Select XAI Method')}</ModalTitle>
            <ModalContent>
                <p className={styles.description}>
                    {i18n.t(
                        'Choose which explainability method to use when computing feature attributions. '
                        + 'The selected method applies to all explanation types (global, local, and horizon).',
                    )}
                </p>

                {!xaiMethods ? (
                    <div className={styles.loading}>
                        <CircularLoader small />
                    </div>
                ) : xaiMethods.length === 0 ? (
                    <NoticeBox warning title={i18n.t('No methods available')}>
                        {i18n.t('No XAI methods are registered. Contact your administrator.')}
                    </NoticeBox>
                ) : (
                    <>
                        <div className={styles.filterBar}>
                            <div className={styles.searchContainer}>
                                <Input
                                    dense
                                    placeholder={i18n.t('Search by name')}
                                    value={searchValue}
                                    onChange={e => setSearchValue(e.value ?? '')}
                                />
                            </div>
                        </div>

                        <div className={styles.content}>
                            {filteredMethods.length === 0 ? (
                                <div className={styles.noResults}>
                                    {i18n.t('No methods found')}
                                </div>
                            ) : (
                                <>
                                    {autoMethods.length > 0 && (
                                        <section>
                                            <div className={styles.sectionLabel}>
                                                {i18n.t('Automatic selection')}
                                            </div>
                                            <div className={styles.methodGrid}>
                                                {autoMethods.map(method => (
                                                    <MethodCard
                                                        key={method.name}
                                                        method={method}
                                                        isSelected={selectedName === method.name}
                                                        onSelect={setSelectedName}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                    {otherMethods.length > 0 && (
                                        <section>
                                            {autoMethods.length > 0 && (
                                                <div className={styles.sectionLabel}>
                                                    {i18n.t('All methods')}
                                                </div>
                                            )}
                                            <div className={styles.methodGrid}>
                                                {otherMethods.map(method => (
                                                    <MethodCard
                                                        key={method.name}
                                                        method={method}
                                                        isSelected={selectedName === method.name}
                                                        onSelect={setSelectedName}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Cancel')}</Button>
                    <Button
                        primary
                        onClick={() => selected && onConfirm(selected)}
                        disabled={!selected}
                    >
                        {i18n.t('Confirm')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};

type MethodCardProps = {
    method: XaiMethodRead;
    isSelected: boolean;
    onSelect: (name: string) => void;
};

const MethodCard = ({ method, isSelected, onSelect }: MethodCardProps) => (
    <button
        type="button"
        className={`${styles.methodCard} ${isSelected ? styles.methodCardSelected : ''}`}
        onClick={() => onSelect(method.name)}
    >
        <div className={styles.methodName}>{method.displayName}</div>
        <div className={styles.methodDescription}>{method.description}</div>
        <div className={styles.methodMeta}>
            <span className={styles.methodAuthor}>{method.author}</span>
            {method.methodTypeLabel && (
                <span className={styles.methodType}>{method.methodTypeLabel}</span>
            )}
            {method.supportedVisualizationLabels && method.supportedVisualizationLabels.length > 0 && (
                <span className={styles.methodVisualizations}>
                    {i18n.t('Plots{{colon}} ', { colon: ':' })}
                    {method.supportedVisualizationLabels.join(', ')}
                </span>
            )}
        </div>
    </button>
);
