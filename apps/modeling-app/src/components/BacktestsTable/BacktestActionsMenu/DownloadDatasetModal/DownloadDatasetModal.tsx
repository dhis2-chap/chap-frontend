import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { OpenAPI } from '@dhis2-chap/ui';
import styles from './DownloadDatasetModal.module.css';

interface DownloadDatasetModalProps {
    datasetId: number;
    onClose: () => void;
}

export const DownloadDatasetModal = ({
    datasetId,
    onClose,
}: DownloadDatasetModalProps) => {
    // Base URL is set in SetChapUrl.tsx and uses the correct route API
    const csvDownloadUrl = `${OpenAPI.BASE}/crud/datasets/${datasetId}/csv`;

    return (
        <Modal
            onClose={onClose}
            small
            dataTest="download-dataset-modal"
        >
            <ModalTitle>
                {i18n.t('Download dataset')}
            </ModalTitle>
            <ModalContent>
                <div className={styles.downloadButtons}>
                    <a
                        href={csvDownloadUrl}
                        download={`dataset-${datasetId}.csv`}
                        className={styles.downloadLink}
                    >
                        <Button secondary>
                            {i18n.t('Download (CSV)')}
                        </Button>
                    </a>
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        dataTest="cancel-download-button"
                    >
                        {i18n.t('Cancel')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
