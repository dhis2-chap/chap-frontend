import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, InputField, Modal, ModalActions, ModalContent, ModalTitle, NoticeBox } from '@dhis2/ui';
import type { AlertPolicyRead } from '@dhis2-chap/ui';
import { useSaveAlertPolicyDisplay } from '@/hooks/useAlertPolicyDisplay';
import { alertPolicyDisplaySchema, getAlertLevelDisplay, type AlertPolicyDisplay } from './alertLevelDisplay';
import { AlertColorSelect } from './AlertColorSelect';
import styles from './BackendAlerts.module.css';

export const EditAlertPolicyDisplayModal = ({ policy, display, onClose }: {
    policy: AlertPolicyRead;
    display: AlertPolicyDisplay;
    onClose: () => void;
}) => {
    const [draft, setDraft] = useState(() => Object.fromEntries((policy.levels ?? []).map(level => [
        level.name, getAlertLevelDisplay(level.name, policy, display),
    ])));
    const save = useSaveAlertPolicyDisplay();
    const valid = alertPolicyDisplaySchema.safeParse(draft).success;

    return (
        <Modal small onClose={onClose} dataTest="edit-alert-policy-display-modal">
            <ModalTitle>{i18n.t('Edit labels and colours')}</ModalTitle>
            <ModalContent>
                <div className={styles.form}>
                    <p className={styles.help}>{policy.name}</p>
                    {(policy.levels ?? []).map((level, index) => (
                        <div key={level.name} className={styles.levelRow}>
                            <InputField
                                dense
                                name={`alert-level-label-${index}`}
                                label={level.name}
                                value={draft[level.name].label}
                                disabled={save.isLoading}
                                error={!draft[level.name].label.trim()}
                                validationText={!draft[level.name].label.trim() ? i18n.t('Enter a level name') : undefined}
                                onChange={({ value }) => setDraft(previous => ({
                                    ...previous, [level.name]: { ...previous[level.name], label: value ?? '' },
                                }))}
                            />
                            <AlertColorSelect
                                value={draft[level.name].color}
                                disabled={save.isLoading}
                                onChange={color => setDraft(previous => ({
                                    ...previous, [level.name]: { ...previous[level.name], color },
                                }))}
                            />
                        </div>
                    ))}
                    {!!save.error && (
                        <NoticeBox error title={i18n.t('Unable to save labels and colours')}>
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
                        disabled={!valid || save.isLoading}
                        onClick={() => save.mutate({ policyId: policy.id, display: draft }, { onSuccess: onClose })}
                    >
                        {i18n.t('Save')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
