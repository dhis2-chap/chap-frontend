import { Button, CircularLoader, InputField, MultiSelectField, MultiSelectOption, NoticeBox, SingleSelectField, SingleSelectOption, TextAreaField } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { PageHeader } from '../components/PageHeader';
import { SettingsEditor } from '../components/SettingsEditor';
import { useBulletinMetadata } from '../hooks/useBulletinMetadata';
import { getDefaultBulletin, MESSAGE_PLACEHOLDERS, validateBulletinSettings } from '../utils/bulletinSettings';
import type { Bulletin } from '../utils/settings';
import styles from '../components/SettingsEditor.module.css';

export const BulletinsPage = () => {
    const metadata = useBulletinMetadata();
    if (metadata.isLoading) return <CircularLoader />;
    if (metadata.error || !metadata.data) return <NoticeBox error>{i18n.t('Could not load bulletin recipients and dashboards.')}</NoticeBox>;
    return (
        <>
            <PageHeader title={i18n.t('Bulletins')} />
            <SettingsEditor validate={validateBulletinSettings}>
                {(settings, update, disabled) => {
                    const updateBulletin = (index: number, patch: Partial<Bulletin>) => update({
                        bulletins: settings.bulletins.map((item, position) => position === index ? { ...item, ...patch } : item),
                    });
                    return (
                        <>
                            <p>{i18n.t('Reviewers preview each message and can edit or skip it before sending.')}</p>
                            <SingleSelectField label={i18n.t('Dashboard link')} clearable selected={settings.bulletinDashboardId ?? ''} disabled={disabled} onChange={({ selected }) => update({ bulletinDashboardId: selected || undefined })}>
                                {metadata.data?.dashboards.map(item => <SingleSelectOption key={item.id} value={item.id} label={item.displayName} />)}
                            </SingleSelectField>
                            <p>
                                {i18n.t('Available template fields')}
                                {' '}
                                {MESSAGE_PLACEHOLDERS.map(key => `{${key}}`).join(', ')}
                            </p>
                            {settings.bulletins.map((bulletin, index) => (
                                <div className={styles.card} key={index}>
                                    <InputField name={`bulletin-name-${index}`} label={i18n.t('Bulletin name')} disabled={disabled} value={bulletin.name} onChange={({ value }) => updateBulletin(index, { name: value })} />
                                    <SingleSelectField label={i18n.t('Send when')} disabled={disabled} selected={bulletin.sendOn} onChange={({ selected }) => updateBulletin(index, { sendOn: selected as Bulletin['sendOn'] })}>
                                        <SingleSelectOption value="alerts" label={i18n.t('Alerts are accepted or withdrawn')} />
                                        <SingleSelectOption value="decisions" label={i18n.t('Any decision is made')} />
                                    </SingleSelectField>
                                    <MultiSelectField label={i18n.t('Recipient user groups')} disabled={disabled} selected={bulletin.recipientUserGroupIds} onChange={({ selected }) => updateBulletin(index, { recipientUserGroupIds: selected })}>
                                        {metadata.data?.groups.map(item => <MultiSelectOption key={item.id} value={item.id} label={item.displayName} />)}
                                    </MultiSelectField>
                                    <InputField name={`bulletin-subject-${index}`} label={i18n.t('Subject template')} disabled={disabled} value={bulletin.subjectTemplate} onChange={({ value }) => updateBulletin(index, { subjectTemplate: value })} />
                                    <TextAreaField name={`bulletin-body-${index}`} label={i18n.t('Message template')} disabled={disabled} value={bulletin.bodyTemplate} onChange={({ value }) => updateBulletin(index, { bodyTemplate: value })} />
                                    <div><Button disabled={disabled} onClick={() => update({ bulletins: settings.bulletins.filter((_, position) => position !== index) })}>{i18n.t('Remove bulletin')}</Button></div>
                                </div>
                            ))}
                            <div><Button disabled={disabled} onClick={() => update({ bulletins: [...settings.bulletins, getDefaultBulletin()] })}>{i18n.t('Add bulletin')}</Button></div>
                        </>
                    );
                }}
            </SettingsEditor>
        </>
    );
};
