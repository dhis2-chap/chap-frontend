import React, { useMemo } from 'react';
import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
    NoticeBox,
    CircularLoader,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useDeleteModel } from '../hooks/useDeleteModel';
import { useBacktests } from '../../../../../../hooks/useBacktests';
import styles from './DeleteModelModal.module.css';

interface DeleteModelModalProps {
    id: number;
    onClose: () => void;
}

export const DeleteModelModal = ({
    id,
    onClose,
}: DeleteModelModalProps) => {
    const {
        deleteModel,
        isPending: deleteIsLoading,
    } = useDeleteModel({
        onSuccess: () => {
            onClose();
        },
    });

    const { backtests, isLoading: isLoadingBacktests, error: backtestsError } = useBacktests();

    const associatedBacktests = useMemo(() => {
        if (!backtests) return [];
        return backtests.filter(backtest => backtest.configuredModel.id === id);
    }, [backtests, id]);

    const hasAssociatedBacktests = associatedBacktests.length > 0;

    if (isLoadingBacktests) {
        return (
            <Modal
                onClose={onClose}
                small
                dataTest="delete-model-modal"
            >
                <ModalTitle>
                    {i18n.t('Archive model')}
                </ModalTitle>
                <ModalContent>
                    <div className={styles.loadingContainer}>
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

    if (backtestsError) {
        return (
            <Modal onClose={onClose} dataTest="delete-model-modal" small>
                <ModalTitle>{i18n.t('Archive model')}</ModalTitle>
                <ModalContent>
                    <NoticeBox
                        error
                        title={i18n.t('Failed to load backtests')}
                    >
                        {backtestsError?.message || i18n.t('An unknown error occurred')}
                    </NoticeBox>
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
        <Modal
            onClose={onClose}
            small
            dataTest="delete-model-modal"
        >
            <ModalTitle>
                {i18n.t('Archive model')}
            </ModalTitle>
            <ModalContent>
                {hasAssociatedBacktests && (
                    <NoticeBox
                        warning
                        title={i18n.t('Cannot archive model')}
                    >
                        {i18n.t('This model has {{count}} associated backtest(s) and cannot be archived. Please delete the associated backtests first.', { count: associatedBacktests.length })}
                    </NoticeBox>
                )}
                {!hasAssociatedBacktests && (
                    <p>
                        {i18n.t('Are you sure you want to archive this model? You will still be able to view evaluations for this model, but you will not be able to create new evaluations or predictions.')}
                    </p>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        secondary
                        disabled={deleteIsLoading}
                        dataTest="cancel-delete-model-button"
                    >
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        onClick={() => deleteModel(id)}
                        destructive
                        loading={deleteIsLoading || isLoadingBacktests}
                        disabled={deleteIsLoading || isLoadingBacktests || hasAssociatedBacktests}
                        dataTest="submit-delete-model-button"
                    >
                        {i18n.t('Archive')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
