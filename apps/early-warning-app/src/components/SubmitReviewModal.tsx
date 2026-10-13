import { useRef } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, Modal, ModalActions, ModalContent, ModalTitle, NoticeBox } from '@dhis2/ui';
import { useSubmitReview, type SubmitReviewInput } from '../hooks/useSubmitReview';
import type { ReviewStep, StepStatus } from '../utils/reviewSubmission';

const stepLabels: Record<ReviewStep, () => string> = {
    validateImport: () => i18n.t('Validate forecast import'),
    recordDecisions: () => i18n.t('Record decisions'),
    saveImport: () => i18n.t('Save import record'),
    importForecast: () => i18n.t('Import forecasts'),
};
const statusLabels: Record<StepStatus, () => string> = {
    pending: () => i18n.t('Waiting'), running: () => i18n.t('Running'), done: () => i18n.t('Done'), failed: () => i18n.t('Failed'),
};

export const SubmitReviewModal = ({ input, pendingCount, onClose, onDone }: {
    input: SubmitReviewInput;
    pendingCount: number;
    onClose: () => void;
    onDone: () => void;
}) => {
    const frozenInput = useRef<SubmitReviewInput>();
    const submission = useSubmitReview();
    const started = !!frozenInput.current;
    const submit = () => {
        frozenInput.current ??= input;
        submission.mutate(frozenInput.current);
    };
    return (
        <Modal onClose={submission.isLoading || (submission.hasWritten && !submission.isSuccess) ? undefined : onClose}>
            <ModalTitle>{i18n.t('Preview review')}</ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t('{{accepted}} accepted, {{declined}} declined, {{pending}} left pending', {
                        accepted: input.accepted.length, declined: input.declined.length, pending: pendingCount,
                    })}
                </p>
                <p>{i18n.t('{{count}} data values to import', { count: input.dataValues.length })}</p>
                {!!input.clearValues?.length && <p>{i18n.t('{{count}} outbreak indicators to clear', { count: input.clearValues.length })}</p>}
                {started && (
                    <ol>
                        {Object.entries(submission.steps).map(([step, status]) => (
                            <li key={step}>
                                {stepLabels[step as ReviewStep]()}
                                :
                                {' '}
                                {statusLabels[status]()}
                            </li>
                        ))}
                    </ol>
                )}
                {submission.error && (
                    <NoticeBox error title={i18n.t('Review submission stopped')}>
                        {submission.error.message}
                        <p>{i18n.t('Retry to continue from the failed step. Keep this page open; completed steps will not run again.')}</p>
                    </NoticeBox>
                )}
                {submission.isSuccess && <NoticeBox title={i18n.t('Review submitted')} />}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    {!submission.isLoading && !submission.hasWritten && <Button onClick={onClose}>{i18n.t('Cancel')}</Button>}
                    {submission.isSuccess
                        ? <Button primary onClick={onDone}>{i18n.t('Done')}</Button>
                        : (
                                <Button primary loading={submission.isLoading} disabled={submission.isLoading} onClick={submit}>
                                    {submission.error ? i18n.t('Retry failed step') : i18n.t('Submit review')}
                                </Button>
                            )}
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
