import { Button, InputField, NoticeBox, TextAreaField } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import type { BulletinMessage } from '../utils/bulletins';
import styles from './SettingsEditor.module.css';

type Props = { messages: BulletinMessage[]; onChange: (messages: BulletinMessage[]) => void; disabled?: boolean };
export const BulletinPreview = ({ messages, onChange, disabled }: Props) => (
    <div className={styles.form}>
        {!messages.length && <NoticeBox>{i18n.t('No bulletins will be sent.')}</NoticeBox>}
        {messages.map((message) => {
            const update = (patch: Partial<BulletinMessage>) => onChange(messages.map(current => current.key === message.key ? { ...current, ...patch } : current));
            return (
                <div key={message.key} className={styles.card}>
                    <h3>
                        {message.bulletinName}
                        {message.orgUnit ? ` — ${message.orgUnit.displayName}` : ''}
                    </h3>
                    <p>{i18n.t('{{groups}} user group(s), {{units}} organisation unit(s)', { groups: message.userGroupIds.length, units: message.orgUnitIds.length })}</p>
                    <InputField label={i18n.t('Subject')} value={message.subject} disabled={disabled} onChange={({ value }) => update({ subject: value })} />
                    <TextAreaField label={i18n.t('Message')} value={message.text} disabled={disabled} onChange={({ value }) => update({ text: value })} />
                    <div><Button disabled={disabled} onClick={() => onChange(messages.filter(current => current.key !== message.key))}>{i18n.t('Skip this bulletin')}</Button></div>
                </div>
            );
        })}
    </div>
);
