import { useState } from 'react';
import {
    FlyoutMenu,
    IconDelete16,
    IconMore16,
    IconView16,
    MenuItem,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';
import { DeletePredictionSetupModal } from './DeletePredictionSetupModal';

type Props = {
    predictionSetupId: number;
};

export const PredictionSetupActionsMenu = ({ predictionSetupId }: Props) => {
    const navigate = useNavigate();
    const [flyoutMenuIsOpen, setFlyoutMenuIsOpen] = useState(false);
    const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);

    const handleView = () => {
        navigate(`/predictions/${predictionSetupId}`);
        setFlyoutMenuIsOpen(false);
    };

    return (
        <>
            <OverflowButton
                small
                open={flyoutMenuIsOpen}
                icon={<IconMore16 />}
                onClick={() => setFlyoutMenuIsOpen(prev => !prev)}
                component={(
                    <FlyoutMenu dense>
                        <MenuItem
                            label={i18n.t('View')}
                            dataTest="prediction-setup-overflow-view"
                            icon={<IconView16 />}
                            onClick={handleView}
                        />
                        <MenuItem
                            label={i18n.t('Delete')}
                            dataTest="prediction-setup-overflow-delete"
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
                <DeletePredictionSetupModal
                    predictionSetupId={predictionSetupId}
                    onClose={() => setDeleteModalIsOpen(false)}
                />
            )}
        </>
    );
};
