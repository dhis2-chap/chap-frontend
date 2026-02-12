import { useState } from 'react';
import { FlyoutMenu, MenuItem, IconDelete16, IconMore16, IconView16, IconDownload16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OverflowButton } from '@dhis2-chap/ui';
import { DeletePredictionModal } from './DeletePredictionModal/DeletePredictionModal';
import { DownloadDatasetModal } from '../../BacktestsTable/BacktestActionsMenu/DownloadDatasetModal';
import { useNavigate } from 'react-router-dom';
import { useIsFeatureAvailable, Features } from '../../../hooks/useIsFeatureAvailable';

type Props = {
    id: number;
    name: string | null | undefined;
    datasetId: number;
};

export const PredictionActionsMenu = ({ id, datasetId }: Props) => {
    const navigate = useNavigate();
    const { isAvailable: isDatasetDownloadAvailable } = useIsFeatureAvailable(Features.DATASET_DOWNLOAD);
    const [flyoutMenuIsOpen, setFlyoutMenuIsOpen] = useState(false);
    const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
    const [downloadModalIsOpen, setDownloadModalIsOpen] = useState(false);

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
                        {isDatasetDownloadAvailable && (
                            <MenuItem
                                label={i18n.t('Download dataset')}
                                dataTest="prediction-overflow-download"
                                icon={<IconDownload16 />}
                                onClick={() => {
                                    setDownloadModalIsOpen(true);
                                    setFlyoutMenuIsOpen(false);
                                }}
                            />
                        )}
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

            {downloadModalIsOpen && (
                <DownloadDatasetModal
                    datasetId={datasetId}
                    onClose={() => setDownloadModalIsOpen(false)}
                />
            )}
        </>
    );
};
