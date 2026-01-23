import { useCallback, useState } from 'react';
import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
    Checkbox,
    CircularLoader,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import styles from './CopyBacktestModal.module.css';
import { useBacktestById } from '../../../../hooks/useBacktestById';

interface CopyBacktestModalProps {
    id: number;
    onClose: () => void;
    returnTo?: string;
}

type CopyableAttributeKey =
    | 'name'
    | 'model'
    | 'dataSources'
    | 'orgUnits'
    | 'periodType'
    | 'period';

type CopyableAttributes = Record<CopyableAttributeKey, boolean>;

const DEFAULT_COPYABLE_ATTRIBUTES: CopyableAttributes = {
    name: true,
    model: true,
    dataSources: true,
    orgUnits: true,
    periodType: true,
    period: true,
};

export const CopyBacktestModal = ({ id, onClose, returnTo }: CopyBacktestModalProps) => {
    const [selectedAttributes, setSelectedAttributes] = useState<CopyableAttributes>(DEFAULT_COPYABLE_ATTRIBUTES);
    const { backtest, isLoading, error } = useBacktestById(id);
    const navigate = useNavigate();

    const handleAttributeChange = (attribute: keyof CopyableAttributes) => {
        setSelectedAttributes(prev => ({
            ...prev,
            [attribute]: !prev[attribute],
        }));
    };

    const generateCopyState = useCallback((): Record<string, unknown> => {
        if (!backtest) return {};

        const state: Record<string, unknown> = {};
        const { dataset } = backtest;

        if (selectedAttributes.name && backtest.name) {
            state.name = i18n.t('{{name}} (Copy)', { name: backtest.name });
        }

        if (selectedAttributes.model && backtest.configuredModel?.id) {
            state.modelId = String(backtest.configuredModel.id);

            if (selectedAttributes.dataSources && dataset?.dataSources?.length) {
                state.dataSources = dataset.dataSources.map(dataSource => ({
                    covariate: dataSource.covariate,
                    dataElementId: dataSource.dataElementId,
                }));
            }
        }

        if (selectedAttributes.orgUnits && backtest.orgUnits?.length) {
            state.orgUnits = backtest.orgUnits;
        }

        if (selectedAttributes.periodType && dataset?.periodType) {
            state.periodType = dataset.periodType.toUpperCase();

            if (selectedAttributes.period) {
                if (dataset?.firstPeriod) {
                    state.fromDate = dataset.firstPeriod;
                }

                if (dataset?.lastPeriod) {
                    state.toDate = dataset.lastPeriod;
                }
            }
        }

        return state;
    }, [backtest, selectedAttributes]);

    const hasSelectedAttributes = Object.values(selectedAttributes).some(Boolean);

    if (isLoading) {
        return (
            <Modal onClose={onClose} dataTest="copy-backtest-modal">
                <ModalTitle>{i18n.t('Create new based on...')}</ModalTitle>
                <ModalContent>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                        <CircularLoader />
                    </div>
                </ModalContent>
                <ModalActions>
                    <ButtonStrip>
                        <Button onClick={onClose} secondary>
                            {i18n.t('Cancel')}
                        </Button>
                    </ButtonStrip>
                </ModalActions>
            </Modal>
        );
    }

    if (error || !backtest) {
        return (
            <Modal onClose={onClose} dataTest="copy-backtest-modal">
                <ModalTitle>{i18n.t('Create new based on...')}</ModalTitle>
                <ModalContent>
                    <p>{i18n.t('Failed to load evaluation data. Please try again.')}</p>
                </ModalContent>
                <ModalActions>
                    <ButtonStrip>
                        <Button onClick={onClose} secondary>
                            {i18n.t('Close')}
                        </Button>
                    </ButtonStrip>
                </ModalActions>
            </Modal>
        );
    }

    return (
        <Modal onClose={onClose} dataTest="copy-backtest-modal">
            <ModalTitle>{i18n.t('Create new based on...')}</ModalTitle>
            <ModalContent>
                <p className={styles.description}>
                    {i18n.t('Select which attributes to copy to the new run{{escape}}', { escape: ':' })}
                </p>

                <div className={styles.attributesList}>
                    <Checkbox
                        label={i18n.t('Name')}
                        name="name"
                        checked={selectedAttributes.name}
                        onChange={() => handleAttributeChange('name')}
                        value={backtest.name || i18n.t('Untitled')}
                    />

                    <Checkbox
                        label={i18n.t('Organisation units')}
                        name="orgUnits"
                        checked={selectedAttributes.orgUnits}
                        onChange={() => handleAttributeChange('orgUnits')}
                        disabled={!(backtest.orgUnits?.length)}
                    />

                    <Checkbox
                        label={i18n.t('Model')}
                        name="model"
                        checked={selectedAttributes.model}
                        onChange={() => handleAttributeChange('model')}
                        value={String(backtest.configuredModel.id)}
                    />

                    <div
                        className={clsx(
                            styles.dependentAttribute,
                            !selectedAttributes.model && styles.dependentAttributeDisabled,
                        )}
                    >
                        <Checkbox
                            label={i18n.t('Data sources')}
                            name="dataSources"
                            checked={selectedAttributes.dataSources}
                            onChange={() => handleAttributeChange('dataSources')}
                            disabled={
                                !selectedAttributes.model
                                || !(backtest.dataset?.dataSources?.length)
                            }
                        />
                    </div>

                    <Checkbox
                        label={i18n.t('Period type')}
                        name="periodType"
                        checked={selectedAttributes.periodType}
                        onChange={() => handleAttributeChange('periodType')}
                        disabled={!backtest.dataset?.periodType}
                    />

                    <div
                        className={clsx(
                            styles.dependentAttribute,
                            !selectedAttributes.periodType && styles.dependentAttributeDisabled,
                        )}
                    >
                        <Checkbox
                            label={i18n.t('Period range')}
                            name="period"
                            checked={selectedAttributes.period}
                            onChange={() => handleAttributeChange('period')}
                            disabled={!backtest.dataset?.periodType || !selectedAttributes.periodType}
                        />
                    </div>
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onClose} secondary>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        disabled={!hasSelectedAttributes}
                        dataTest="copy-backtest-button"
                        onClick={() => {
                            const url = returnTo
                                ? `/evaluate/new?returnTo=${encodeURIComponent(returnTo)}`
                                : '/evaluate/new';
                            navigate(url, { state: generateCopyState() });
                        }}
                    >
                        {i18n.t('Create')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
