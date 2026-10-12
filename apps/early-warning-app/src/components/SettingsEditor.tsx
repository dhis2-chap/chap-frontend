import { useState, type ReactNode } from 'react';
import { useAlert } from '@dhis2/app-runtime';
import { Button, CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSaveSettings, useSettings } from '../hooks/useSettings';
import type { Settings } from '../utils/settings';
import styles from './SettingsEditor.module.css';

type Props = { children: (settings: Settings, update: (patch: Partial<Settings>) => void, disabled: boolean) => ReactNode; validate?: (settings: Settings) => string | undefined };
const Editor = ({ initial, exists, children, validate }: Props & { initial: Settings; exists: boolean }) => {
    const [settings, setSettings] = useState(initial);
    const [error, setError] = useState<string>();
    const { canApprove } = useCurrentUser();
    const save = useSaveSettings();
    const { show } = useAlert(i18n.t('Settings saved'), { success: true });
    const disabled = !canApprove || save.isLoading;
    const submit = async () => {
        const validationError = validate?.(settings);
        setError(validationError);
        if (validationError) return;
        try {
            await save.mutateAsync({ settings, exists });
            show();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : i18n.t('Could not save settings.'));
        }
    };
    return (
        <div className={styles.form}>
            {!canApprove && <NoticeBox>{i18n.t('You can view settings. Review permission is required to change them.')}</NoticeBox>}
            {children(settings, patch => setSettings(current => ({ ...current, ...patch })), disabled)}
            {error && <NoticeBox error>{error}</NoticeBox>}
            <div><Button primary disabled={disabled} loading={save.isLoading} onClick={submit}>{i18n.t('Save settings')}</Button></div>
        </div>
    );
};
export const SettingsEditor = (props: Props) => {
    const query = useSettings();
    const user = useCurrentUser();
    if (query.isLoading || user.isLoading) return <CircularLoader />;
    if (query.error || user.error) return <NoticeBox error>{i18n.t('Could not load settings or permissions.')}</NoticeBox>;
    if (!query.data) return null;
    const { exists, ...initial } = query.data;
    return <Editor {...props} initial={initial} exists={exists} />;
};
