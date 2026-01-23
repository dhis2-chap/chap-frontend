import { useState } from 'react';
import {
    FlyoutMenu,
    MenuItem,
    IconDelete16,
    IconEdit16,
    IconMore16,
    IconDuplicate16,
    IconVisualizationLineMulti16,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';
import { EditBacktestModal } from './EditBacktestModal';
import { DeleteBacktestModal } from './DeleteBacktestModal/DeleteBacktestModal';
import { CopyBacktestModal } from './CopyBacktestModal';
import { useNavigate } from 'react-router-dom';

type Props = {
    id: number;
    name: string | null | undefined;
    onRename?: () => void;
    onDelete?: () => void;
};

export const BacktestActionsMenu = ({
    id,
    name,
}: Props) => {
    const navigate = useNavigate();
    const [flyoutMenuIsOpen, setFlyoutMenuIsOpen] = useState(false);
    const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
    const [editModalIsOpen, setEditModalIsOpen] = useState(false);
    const [copyModalIsOpen, setCopyModalIsOpen] = useState(false);

    const handleCompare = () => {
        navigate(`/evaluate/compare?baseEvaluation=${id}&returnTo=${encodeURIComponent('/evaluate')}`);
    };

    return (
        <>
            <OverflowButton
                small
                open={flyoutMenuIsOpen}
                icon={<IconMore16 />}
                onClick={() => {
                    setFlyoutMenuIsOpen(prev => !prev);
                }}
                component={(
                    <FlyoutMenu dense>
                        <MenuItem
                            label={i18n.t('Create new...')}
                            dataTest="backtest-overflow-copy"
                            icon={<IconDuplicate16 />}
                            onClick={() => {
                                setCopyModalIsOpen(true);
                                setFlyoutMenuIsOpen(false);
                            }}
                        />
                        <MenuItem
                            label={i18n.t('Compare')}
                            dataTest="backtest-overflow-view"
                            icon={<IconVisualizationLineMulti16 />}
                            onClick={() => {
                                handleCompare();
                                setFlyoutMenuIsOpen(false);
                            }}
                        />
                        <MenuItem
                            label={i18n.t('Rename')}
                            dataTest="backtest-overflow-rename"
                            icon={<IconEdit16 />}
                            onClick={() => {
                                setEditModalIsOpen(true);
                                setFlyoutMenuIsOpen(false);
                            }}
                        />
                        <MenuItem
                            label={i18n.t('Delete')}
                            dataTest="backtest-overflow-delete"
                            destructive
                            icon={<IconDelete16 />}
                            onClick={() => {
                                setDeleteModalIsOpen(true);
                                setFlyoutMenuIsOpen(false);
                            }}
                        />
                    </FlyoutMenu>
                )}
            />

            {editModalIsOpen && (
                <EditBacktestModal
                    id={id}
                    initialName={name ?? ''}
                    onClose={() => setEditModalIsOpen(false)}
                />
            )}

            {copyModalIsOpen && (
                <CopyBacktestModal
                    id={id}
                    onClose={() => setCopyModalIsOpen(false)}
                />
            )}

            {deleteModalIsOpen && (
                <DeleteBacktestModal
                    id={id}
                    onClose={() => setDeleteModalIsOpen(false)}
                />
            )}
        </>
    );
};
