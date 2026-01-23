import { useState } from 'react';
import { FlyoutMenu, MenuItem, IconDelete16, IconMore16, IconView16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';
import { DeletePredictionModal } from './DeletePredictionModal/DeletePredictionModal';
import { useNavigate } from 'react-router-dom';

type Props = {
    id: number;
    name: string | null | undefined;
};

export const PredictionActionsMenu = ({ id }: Props) => {
    const navigate = useNavigate();
    const [flyoutMenuIsOpen, setFlyoutMenuIsOpen] = useState(false);
    const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);

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
                            label={i18n.t('View')}
                            icon={<IconView16 />}
                            dataTest="prediction-overflow-view"
                            onClick={() => {
                                navigate(`/predictions/${id}`);
                                setFlyoutMenuIsOpen(false);
                            }}
                        />
                        <MenuItem
                            label={i18n.t('Delete')}
                            dataTest="prediction-overflow-delete"
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
            {deleteModalIsOpen && (
                <DeletePredictionModal
                    id={id}
                    onClose={() => setDeleteModalIsOpen(false)}
                />
            )}
        </>
    );
};
