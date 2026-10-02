import { useState } from 'react';
import { Link } from 'react-router-dom';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui';
import { Tag, Widget, type PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import { useAlertPolicies } from '@/hooks/useAlertPolicies';
import { getChapErrorMessage } from '@/utils/chapErrors';
import { useUpdatePredictionSetup } from '../PageContent/ConfiguredModelDashboard/QuickActionsWidget/hooks/useUpdatePredictionSetup';
import { describeAlertLevel } from './describeAlertLevel';
import styles from './BackendAlerts.module.css';

const ChangeAlertPolicyModal = ({ setup, onClose }: { setup: PredictionSetupReadWithPredictions; onClose: () => void }) => {
    const { data: policies, error, isLoading } = useAlertPolicies();
    const [selected, setSelected] = useState(setup.alertPolicy?.id ? String(setup.alertPolicy.id) : undefined);
    const { updatePredictionSetup, isUpdating } = useUpdatePredictionSetup({ onSuccess: onClose });

    return (
        <Modal small onClose={onClose}>
            <ModalTitle>{i18n.t('Alert policy')}</ModalTitle>
            <ModalContent>
                {isLoading && <CircularLoader small />}
                {error && (
                    <NoticeBox error title={i18n.t('Unable to load alert policies')}>
                        {getChapErrorMessage(error)}
                    </NoticeBox>
                )}
                {policies?.length === 0 && (
                    <p>
                        {i18n.t('No alert policies yet.')}
                        {' '}
                        <Link to="/alerts/policies">{i18n.t('Create a policy')}</Link>
                    </p>
                )}
                {!!policies?.length && (
                    <SingleSelectField
                        label={i18n.t('Policy')}
                        placeholder={i18n.t('Select an alert policy')}
                        selected={policies.some(policy => String(policy.id) === selected) ? selected : undefined}
                        onChange={({ selected: value }) => setSelected(value)}
                    >
                        {policies.map(policy => (
                            <SingleSelectOption key={policy.id} value={String(policy.id)} label={policy.name} />
                        ))}
                    </SingleSelectField>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} disabled={isUpdating}>{i18n.t('Cancel')}</Button>
                    <Button
                        primary
                        disabled={!selected || selected === String(setup.alertPolicy?.id)}
                        loading={isUpdating}
                        onClick={() => updatePredictionSetup({
                            predictionSetupId: setup.id,
                            data: { alertPolicyId: Number(selected) },
                        }).catch(() => {
                            // useUpdatePredictionSetup reports the failure; keep the modal open for a retry.
                        })}
                    >
                        {i18n.t('Save')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};

export const AlertPolicyWidget = ({ setup }: { setup: PredictionSetupReadWithPredictions }) => {
    const [editing, setEditing] = useState(false);
    const policy = setup.alertPolicy;

    return (
        <>
            <Widget header={i18n.t('Alerts')} noncollapsible>
                <div className={styles.widgetContent}>
                    <div className={styles.row}>
                        <span className={styles.label}>{i18n.t('Alert policy')}</span>
                        <span className={styles.value} data-test="alert-policy-name">
                            {policy?.name ?? i18n.t('None')}
                        </span>
                        {!!policy?.levels?.length && (
                            <div className={styles.tags}>
                                {policy.levels.map(level => (
                                    <Tag key={level.name}>{describeAlertLevel(level)}</Tag>
                                ))}
                            </div>
                        )}
                    </div>
                    <Button small secondary onClick={() => setEditing(true)}>
                        {i18n.t('Change policy')}
                    </Button>
                </div>
            </Widget>
            {editing && <ChangeAlertPolicyModal setup={setup} onClose={() => setEditing(false)} />}
        </>
    );
};
