import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, InputField, Modal, ModalActions, ModalContent, ModalTitle, NoticeBox } from '@dhis2/ui';
import type { AlertPolicyRead } from '@dhis2-chap/ui';
import { useUpdateAlertPolicyCodes } from '@/hooks/useAlertPolicies';
import { useSaveAlertPolicyDisplay } from '@/hooks/useAlertPolicyDisplay';
import { getAlertLevelDisplay, type AlertPolicyDisplay } from './alertLevelDisplay';
import { AlertColorSelect } from './AlertColorSelect';
import styles from './BackendAlerts.module.css';

const isValid = (codes: string[]) => codes.every(code => code.length > 0) && new Set(codes).size === codes.length;

export const EditAlertPolicyModal = ({ policy, display, onClose }: {
    policy: AlertPolicyRead;
    display: AlertPolicyDisplay;
    onClose: () => void;
}) => {
    const levels = policy.levels ?? [];
    const [noAlertCode, setNoAlertCode] = useState(policy.noAlertOutputCode ?? '0');
    const [codes, setCodes] = useState(() => Object.fromEntries(levels.map(level => [level.name, level.outputCode])));
    const [colors, setColors] = useState<AlertPolicyDisplay>(() => Object.fromEntries(levels.map(level => [
        level.name, { color: getAlertLevelDisplay(level.name, policy, display).color },
    ])));
    const saveCodes = useUpdateAlertPolicyCodes();
    const saveDisplay = useSaveAlertPolicyDisplay();
    const isSaving = saveCodes.isLoading || saveDisplay.isLoading;
    // The backend rejects codes with surrounding whitespace.
    const noAlertOutputCode = noAlertCode.trim();
    const levelOutputCodes = Object.fromEntries(Object.entries(codes).map(([name, code]) => [name, code.trim()]));
    const valid = isValid([noAlertOutputCode, ...Object.values(levelOutputCodes)]);
    const save = async () => {
        await Promise.all([
            saveCodes.mutateAsync({ policyId: policy.id, codes: { noAlertOutputCode, levelOutputCodes } }),
            saveDisplay.mutateAsync({ policyId: policy.id, display: colors }),
        ]);
        onClose();
    };

    return (
        <Modal small onClose={onClose} dataTest="edit-alert-policy-modal">
            <ModalTitle>{policy.name}</ModalTitle>
            <ModalContent>
                <div className={styles.form}>
                    <p className={styles.help}>{i18n.t('Codes are imported as the outbreak indicator value. Severity follows level order.')}</p>
                    <InputField
                        name="no-alert-output-code"
                        label={i18n.t('No alert code')}
                        value={noAlertCode}
                        disabled={isSaving}
                        onChange={({ value }) => setNoAlertCode(value ?? '')}
                    />
                    {levels.map((level, index) => (
                        <div key={level.name} className={styles.form}>
                            <InputField
                                name={`alert-output-code-${index}`}
                                label={i18n.t('{{level}} code', { level: level.name })}
                                value={codes[level.name]}
                                disabled={isSaving}
                                onChange={({ value }) => setCodes(previous => ({ ...previous, [level.name]: value ?? '' }))}
                            />
                            <AlertColorSelect
                                label={i18n.t('{{level}} colour', { level: level.name })}
                                value={colors[level.name].color}
                                disabled={isSaving}
                                onChange={color => setColors(previous => ({ ...previous, [level.name]: { color } }))}
                            />
                        </div>
                    ))}
                    {!valid && <NoticeBox warning>{i18n.t('Codes must be unique and non-empty.')}</NoticeBox>}
                    {(!!saveCodes.error || !!saveDisplay.error) && (
                        <NoticeBox error>{i18n.t('Unable to save. Please try again.')}</NoticeBox>
                    )}
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} disabled={isSaving}>{i18n.t('Cancel')}</Button>
                    <Button primary loading={isSaving} disabled={isSaving || !valid} onClick={() => void save().catch(() => undefined)}>
                        {i18n.t('Save')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
