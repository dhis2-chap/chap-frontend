import React, { useState } from 'react';
import { FlyoutMenu, MenuItem, IconDelete16, IconMore16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';
import { DeletePredictionModal } from './DeletePredictionModal/DeletePredictionModal';

type Props = {
    id: number;
    name: string | null | undefined;
};

export const PredictionActionsMenu = ({ id }: Props) => {
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
