import i18n from '@dhis2/d2-i18n';
import { useAlert } from '@dhis2/app-runtime';
import { Button, ButtonStrip, Modal, ModalActions, ModalContent, ModalTitle, NoticeBox } from '@dhis2/ui';
import { SignalReviewTable, type SignalReviewTableProps } from '@dhis2-chap/ui';
import { useApproveAlert } from '@/hooks/useApproveAlert';
import styles from './BackendAlerts.module.css';

type Props = Pick<SignalReviewTableProps, 'alerts' | 'orgUnitNames' | 'formatPeriod'> & {
    onClose: () => void;
};

export const ReviewSignalsModal = ({ alerts, orgUnitNames, formatPeriod, onClose }: Props) => {
    const approval = useApproveAlert();
    const { show: showApproved } = useAlert(i18n.t('Signal approved'), { success: true });

    return (
        <Modal large onClose={approval.isLoading ? undefined : onClose} dataTest="review-signals-modal">
            <ModalTitle>{i18n.t('Review signals')}</ModalTitle>
            <ModalContent>
                <div className={styles.form}>
                    <p className={styles.help}>
                        {i18n.t('Approve a signal to clear it for dissemination. Signals you do not approve stay pending.')}
                    </p>
                    {approval.userError && (
                        <NoticeBox error>{i18n.t('Unable to load the signed-in user. Close and reopen this review to retry.')}</NoticeBox>
                    )}
                    {approval.isError && (
                        <NoticeBox error>{i18n.t('Unable to approve the signal. Please try again.')}</NoticeBox>
                    )}
                    <SignalReviewTable
                        alerts={alerts}
                        orgUnitNames={orgUnitNames}
                        formatPeriod={formatPeriod}
                        disabled={!approval.isUserLoaded}
                        approvingId={approval.isLoading ? approval.variables : undefined}
                        onApprove={id => approval.mutate(id, { onSuccess: () => showApproved() })}
                    />
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} disabled={approval.isLoading}>{i18n.t('Close')}</Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
