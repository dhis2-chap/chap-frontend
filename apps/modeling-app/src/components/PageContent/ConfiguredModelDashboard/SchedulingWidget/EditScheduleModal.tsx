import { useState } from 'react';
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
    Switch,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useUpdatePredictionSetup } from '../QuickActionsWidget/hooks/useUpdatePredictionSetup';
import styles from './EditScheduleModal.module.css';

const DEFAULT_CRON_EXPRESSION = '0 0 * * *';

type Props = {
    predictionSetupId: number;
    scheduleEnabled: boolean;
    scheduleCronExpression: string | null;
    onClose: () => void;
};

export const EditScheduleModal = ({
    predictionSetupId,
    scheduleEnabled,
    scheduleCronExpression,
    onClose,
}: Props) => {
    const [enabled, setEnabled] = useState(scheduleEnabled);
    const { updatePredictionSetup, isUpdating } = useUpdatePredictionSetup({
        onSuccess: () => onClose(),
    });

    const handleSwitchClick = (event: React.MouseEvent) => {
        event.stopPropagation();
    };

    const handleSave = async () => {
        try {
            await updatePredictionSetup({
                predictionSetupId,
                data: {
                    scheduleEnabled: enabled,
                    ...(enabled && !scheduleCronExpression
                        ? { scheduleCronExpression: DEFAULT_CRON_EXPRESSION }
                        : {}),
                },
            });
        } catch {
            // Error alert is shown by useUpdatePredictionSetup's onError
        }
    };

    const isDirty = enabled !== scheduleEnabled;

    return (
        <Modal
            onClose={onClose}
            dataTest="edit-schedule-modal"
        >
            <ModalTitle>
                {i18n.t('Edit schedule')}
            </ModalTitle>
            <ModalContent>
                <div className={styles.content}>
                    <div className={styles.toggleRow}>
                        <div className={styles.toggleText}>
                            <span className={styles.toggleLabel}>
                                {i18n.t('Scheduled predictions')}
                            </span>
                            <span className={styles.toggleDescription}>
                                {i18n.t('Enable to include this setup in scheduled prediction runs.')}
                            </span>
                        </div>
                        <span onClick={handleSwitchClick}>
                            <Switch
                                checked={enabled}
                                onChange={() => setEnabled(prev => !prev)}
                                disabled={isUpdating}
                                dataTest="schedule-enabled-toggle"
                            />
                        </span>
                    </div>
                    <NoticeBox title={i18n.t('About scheduling')}>
                        {i18n.t('The external CHAP scheduler must be running for scheduled predictions to execute. Contact your system administrator to set up the scheduler.')}
                    </NoticeBox>
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        secondary
                        disabled={isUpdating}
                        dataTest="cancel-edit-schedule-button"
                    >
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        loading={isUpdating}
                        disabled={isUpdating || !isDirty}
                        onClick={handleSave}
                        dataTest="save-edit-schedule-button"
                    >
                        {i18n.t('Save')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
