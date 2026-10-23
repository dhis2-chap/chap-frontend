import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, InputField, Modal, ModalActions, ModalContent, ModalTitle, NoticeBox } from '@dhis2/ui';
import type { AlertPolicyRead } from '@dhis2-chap/ui';
import { useSaveAlertPolicyOutputCodes } from '@/hooks/useAlertPolicyOutputCodes';
import { alertPolicyOutputCodesSchema, type AlertPolicyOutputCodes } from './alertPolicyOutputCodes';
import styles from './BackendAlerts.module.css';

export const EditAlertPolicyOutputCodesModal = ({ policy, codes, onClose }: {
    policy: AlertPolicyRead;
    codes: AlertPolicyOutputCodes;
    onClose: () => void;
}) => {
    const [draft, setDraft] = useState(codes);
    const save = useSaveAlertPolicyOutputCodes();
    const parsed = alertPolicyOutputCodesSchema.safeParse(draft);
    return (
        <Modal small onClose={onClose} dataTest="edit-alert-policy-output-codes-modal">
            <ModalTitle>{i18n.t('Edit alert output codes')}</ModalTitle>
            <ModalContent>
                <div className={styles.form}>
                    <p>{policy.name}</p>
                    <p className={styles.help}>
                        {i18n.t('Codes are imported into the outbreak indicator data element. Use distinct codes matching its value type or option set. Severity follows the policy level order, not the code value.')}
                    </p>
                    <InputField
                        name="no-alert-output-code"
                        label={i18n.t('No alert')}
                        value={draft.noAlert}
                        disabled={save.isLoading}
                        onChange={({ value }) => setDraft(previous => ({ ...previous, noAlert: value ?? '' }))}
                    />
                    {(policy.levels ?? []).map((level, index) => (
                        <InputField
                            key={level.name}
                            name={`alert-output-code-${index}`}
                            label={level.name}
                            value={draft.levels[level.name]}
                            disabled={save.isLoading}
                            onChange={({ value }) => setDraft(previous => ({
                                ...previous, levels: { ...previous.levels, [level.name]: value ?? '' },
                            }))}
                        />
                    ))}
                    {!parsed.success && <NoticeBox warning>{i18n.t('Enter a unique, non-empty code for every level and for no alert.')}</NoticeBox>}
                    {!!save.error && <NoticeBox error>{i18n.t('Unable to save alert output codes. Please try again.')}</NoticeBox>}
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} disabled={save.isLoading}>{i18n.t('Cancel')}</Button>
                    <Button
                        primary
                        loading={save.isLoading}
                        disabled={save.isLoading || !parsed.success}
                        onClick={() => save.mutate({ policyId: policy.id, codes: draft }, { onSuccess: onClose })}
                    >
                        {i18n.t('Save')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
