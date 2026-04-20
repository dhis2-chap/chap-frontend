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
import styles from './DownloadModal.module.css';

interface DownloadModalProps {
    backtestId: number;
    backtestName?: string | null;
    datasetId: number;
    isDatasetDownloadAvailable: boolean;
    onClose: () => void;
}

export const DownloadModal = ({
    backtestId,
    backtestName,
    datasetId,
    isDatasetDownloadAvailable,
    onClose,
}: DownloadModalProps) => {
    // Base URL is set in SetChapUrl.tsx and uses the correct route API
    const datasetDownloadUrl = `${OpenAPI.BASE}/v1/crud/datasets/${datasetId}/csv`;
    const metricsDownloadUrl = `${OpenAPI.BASE}/v1/crud/backtests/${backtestId}/metrics/csv`;

    const safeName = (backtestName ?? `backtest-${backtestId}`)
        .replace(/[^a-z0-9-_]+/gi, '-')
        .replace(/^-+|-+$/g, '') || `backtest-${backtestId}`;

    return (
        <Modal
            onClose={onClose}
            small
            dataTest="download-modal"
        >
            <ModalTitle>
                {i18n.t('Download')}
            </ModalTitle>
            <ModalContent>
                <div className={styles.sections}>
                    {isDatasetDownloadAvailable && (
                        <div className={styles.section}>
                            <h4 className={styles.sectionTitle}>
                                {i18n.t('Dataset')}
                            </h4>
                            <p className={styles.description}>
                                {i18n.t(
                                    'The dataset used to train and evaluate this model, as a CSV.',
                                )}
                            </p>
                            <a
                                href={datasetDownloadUrl}
                                download={`dataset-${datasetId}.csv`}
                                className={styles.downloadLink}
                            >
                                <Button
                                    secondary
                                    dataTest="download-dataset-button"
                                >
                                    {i18n.t('Download dataset (CSV)')}
                                </Button>
                            </a>
                        </div>
                    )}
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>
                            {i18n.t('Evaluation metrics')}
                        </h4>
                        <p className={styles.description}>
                            {i18n.t(
                                'Every applicable metric for this evaluation as a long-format CSV with one row per metric, location, time period and horizon.',
                            )}
                        </p>
                        <a
                            href={metricsDownloadUrl}
                            download={`${safeName}-metrics.csv`}
                            className={styles.downloadLink}
                        >
                            <Button
                                secondary
                                dataTest="download-metrics-button"
                            >
                                {i18n.t('Download metrics (CSV)')}
                            </Button>
                        </a>
                    </div>
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        dataTest="close-download-modal-button"
                    >
                        {i18n.t('Close')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
