import { useState } from 'react';
import {
    FlyoutMenu,
    IconDelete16,
    IconImportItems24,
    IconList24,
    IconMore16,
    IconView24,
    MenuItem,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';
import type { JobDescription } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';
import { DeletePredictionRunModal } from './DeletePredictionRunModal';
import { ViewJobLogsModal } from '../../../JobsTable/JobActionsMenu/ViewJobLogsModal/ViewJobLogsModal';

type Props = {
    predictionSetupId?: string;
    predictionId: number;
    job?: JobDescription;
};

export const PredictionRunActionsMenu = ({
    predictionSetupId,
    predictionId,
    job,
}: Props) => {
    const navigate = useNavigate();
    const [flyoutMenuIsOpen, setFlyoutMenuIsOpen] = useState(false);
    const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
    const [logsModalIsOpen, setLogsModalIsOpen] = useState(false);
    const parsedPredictionSetupId = Number(predictionSetupId);
    const numericPredictionSetupId = Number.isFinite(parsedPredictionSetupId)
        ? parsedPredictionSetupId
        : undefined;

    const navigateToView = () => {
        if (!predictionSetupId) {
            return;
        }

        navigate(`/predictions/${predictionSetupId}/runs/${predictionId}`);
        setFlyoutMenuIsOpen(false);
    };

    const navigateToImport = () => {
        if (!predictionSetupId) {
            return;
        }

        navigate(`/predictions/${predictionSetupId}/runs/${predictionId}/import`);
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
                        {job && (
                            <MenuItem
                                label={i18n.t('View Logs')}
                                dataTest="prediction-run-overflow-logs"
                                icon={<IconList24 />}
                                onClick={() => {
                                    setLogsModalIsOpen(true);
                                    setFlyoutMenuIsOpen(false);
                                }}
                            />
                        )}
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

            {logsModalIsOpen && job && (
                <ViewJobLogsModal
                    jobId={job.id}
                    status={job.status}
                    onClose={() => setLogsModalIsOpen(false)}
                />
            )}

            {deleteModalIsOpen && (
                <DeletePredictionRunModal
                    predictionId={predictionId}
                    predictionSetupId={numericPredictionSetupId}
                    onClose={() => setDeleteModalIsOpen(false)}
                />
            )}
        </>
    );
};
