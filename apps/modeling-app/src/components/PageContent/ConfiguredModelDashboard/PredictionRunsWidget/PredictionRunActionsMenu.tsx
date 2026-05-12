import { useState } from 'react';
import {
    FlyoutMenu,
    IconDelete16,
    IconImportItems24,
    IconMore16,
    IconView24,
    MenuItem,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';
import { DeletePredictionRunModal } from './DeletePredictionRunModal';

type Props = {
    configuredId?: string;
    predictionId: number;
};

export const PredictionRunActionsMenu = ({
    configuredId,
    predictionId,
}: Props) => {
    const navigate = useNavigate();
    const [flyoutMenuIsOpen, setFlyoutMenuIsOpen] = useState(false);
    const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
    const parsedConfiguredId = Number(configuredId);
    const predictionSetupId = Number.isFinite(parsedConfiguredId)
        ? parsedConfiguredId
        : undefined;

    const navigateToView = () => {
        if (!configuredId) {
            return;
        }

        navigate(`/predictions/${configuredId}/runs/${predictionId}`);
        setFlyoutMenuIsOpen(false);
    };

    const navigateToImport = () => {
        if (!configuredId) {
            return;
        }

        navigate(`/predictions/${configuredId}/runs/${predictionId}/import`);
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
                            dataTest="prediction-run-overflow-view"
                            icon={<IconView24 />}
                            onClick={navigateToView}
                        />
                        <MenuItem
                            label={i18n.t('Import')}
                            dataTest="prediction-run-overflow-import"
                            icon={<IconImportItems24 />}
                            onClick={navigateToImport}
                        />
                        <MenuItem
                            label={i18n.t('Delete')}
                            dataTest="prediction-run-overflow-delete"
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
                <DeletePredictionRunModal
                    predictionId={predictionId}
                    predictionSetupId={predictionSetupId}
                    onClose={() => setDeleteModalIsOpen(false)}
                />
            )}
        </>
    );
};
