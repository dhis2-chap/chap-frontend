import { useState, useMemo } from 'react';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    Input,
    MenuItem,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
    SingleSelect,
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

const isAutoMethod = (method: XaiMethodRead) =>
    method.methodType?.toLowerCase().includes('auto') ||
    method.name?.toLowerCase().includes('auto');

export const XaiMethodSelectionModal = ({
    xaiMethods,
    selectedMethodName,
    onClose,
    onConfirm,
}: Props) => {
    const [selected, setSelected] = useState<XaiMethodRead | undefined>(
        xaiMethods?.find(m => m.name === selectedMethodName),
    );
    const [searchValue, setSearchValue] = useState('');
    const [methodTypeFilter, setMethodTypeFilter] = useState<string | undefined>(undefined);

    const methodTypes = useMemo(() => {
        if (!xaiMethods) return [];
        return [...new Set(xaiMethods.map(m => m.methodType).filter(Boolean))];
    }, [xaiMethods]);

    const filteredMethods = useMemo(() => {
        if (!xaiMethods) return [];
        return xaiMethods
            .filter(m => {
                const matchesSearch = !searchValue ||
                    m.displayName?.toLowerCase().includes(searchValue.toLowerCase()) ||
                    m.description?.toLowerCase().includes(searchValue.toLowerCase());
                const matchesType = !methodTypeFilter || m.methodType === methodTypeFilter;
                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                const aIsAuto = isAutoMethod(a);
                const bIsAuto = isAutoMethod(b);
                if (aIsAuto && !bIsAuto) return -1;
                if (!aIsAuto && bIsAuto) return 1;
                return (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name);
            });
    }, [xaiMethods, searchValue, methodTypeFilter]);

    const autoMethods = filteredMethods.filter(isAutoMethod);
    const otherMethods = filteredMethods.filter(m => !isAutoMethod(m));

    return (
        <Modal fluid onClose={onClose}>
            <ModalTitle>{i18n.t('Select XAI Method')}</ModalTitle>
            <ModalContent>
                <p className={styles.description}>
                    {i18n.t(
                        'Choose which explainability method to use when computing feature attributions. ' +
                        'The selected method applies to all explanation types (global, local, and horizon).',
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
                            {methodTypes.length > 1 && (
                                <div className={styles.selectContainer}>
                                    <SingleSelect
                                        dense
                                        clearable
                                        clearText={i18n.t('Clear')}
                                        placeholder={i18n.t('Method type')}
                                        selected={methodTypeFilter}
                                        onChange={e => setMethodTypeFilter(e.selected)}
                                    >
                                        {methodTypes.map(type => (
                                            <MenuItem
                                                key={type}
                                                label={type}
                                                value={type}
                                            />
                                        ))}
                                    </SingleSelect>
                                </div>
                            )}
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
                                                        isSelected={selected?.name === method.name}
                                                        onSelect={setSelected}
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
                                                        isSelected={selected?.name === method.name}
                                                        onSelect={setSelected}
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
    onSelect: (method: XaiMethodRead) => void;
};

const MethodCard = ({ method, isSelected, onSelect }: MethodCardProps) => (
    <button
        type="button"
        className={`${styles.methodCard} ${isSelected ? styles.methodCardSelected : ''}`}
        onClick={() => onSelect(method)}
    >
        <div className={styles.methodName}>{method.displayName}</div>
        <div className={styles.methodDescription}>{method.description}</div>
        <div className={styles.methodMeta}>
            <span className={styles.methodAuthor}>{method.author}</span>
            {method.methodType && (
                <span className={styles.methodType}>{method.methodType}</span>
            )}
            {method.supportedVisualizations && method.supportedVisualizations.length > 0 && (
                <span className={styles.methodVisualizations}>
                    {i18n.t('Plots{{colon}} ', { colon: ':' })}
                    {method.supportedVisualizations.join(', ')}
                </span>
            )}
        </div>
    </button>
);
