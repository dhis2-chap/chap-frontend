import { Modal, ModalTitle, ModalContent, ModalActions, Button } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ViewJobLogsModal.module.css';
import { JobLogs } from './JobLogs';

interface ViewJobLogsModalProps {
    jobId: string;
    status: string;
    onClose: () => void;
}

export const ViewJobLogsModal = ({ jobId, status, onClose }: ViewJobLogsModalProps) => (
    <Modal onClose={onClose} fluid>
        <ModalTitle>
            {i18n.t('Job Logs')}
            {' - '}
            {jobId}
        </ModalTitle>
        <ModalContent className={styles.modal}>
            <JobLogs key={jobId} jobId={jobId} status={status} />
        </ModalContent>
        <ModalActions>
            <Button onClick={onClose} secondary>
                {i18n.t('Close')}
            </Button>
        </ModalActions>
    </Modal>
);
