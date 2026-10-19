import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, Modal, ModalActions, ModalContent, ModalTitle, NoticeBox } from '@dhis2/ui';
import type { AlertPolicyRead } from '@dhis2-chap/ui';
import { useSaveAlertPolicyDisplay } from '@/hooks/useAlertPolicyDisplay';
import { getAlertLevelDisplay, type AlertPolicyDisplay } from './alertLevelDisplay';
import { AlertColorSelect } from './AlertColorSelect';
import styles from './BackendAlerts.module.css';

export const EditAlertPolicyDisplayModal = ({ policy, display, onClose }: {
    policy: AlertPolicyRead;
    display: AlertPolicyDisplay;
    onClose: () => void;
}) => {
    const [draft, setDraft] = useState<AlertPolicyDisplay>(() => Object.fromEntries((policy.levels ?? []).map(level => [
        level.name, { color: getAlertLevelDisplay(level.name, policy, display).color },
    ])));
    const save = useSaveAlertPolicyDisplay();

    return (
        <Modal small onClose={onClose} dataTest="edit-alert-policy-display-modal">
            <ModalTitle>{i18n.t('Edit alert colours')}</ModalTitle>
            <ModalContent>
                <div className={styles.form}>
                    <p className={styles.help}>{policy.name}</p>
                    {(policy.levels ?? []).map(level => (
                        <AlertColorSelect
                            key={level.name}
                            label={level.name}
                            value={draft[level.name].color}
                            disabled={save.isLoading}
                            onChange={color => setDraft(previous => ({ ...previous, [level.name]: { color } }))}
                        />
                    ))}
                    {!!save.error && (
                        <NoticeBox error title={i18n.t('Unable to save alert colours')}>
                            {i18n.t('Please try again.')}
                        </NoticeBox>
                    )}
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} disabled={save.isLoading}>{i18n.t('Cancel')}</Button>
                    <Button
                        primary
                        loading={save.isLoading}
                        disabled={save.isLoading}
                        onClick={() => save.mutate({ policyId: policy.id, display: draft }, { onSuccess: onClose })}
                    >
                        {i18n.t('Save')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
