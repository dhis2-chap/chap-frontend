import { useConfig } from '@dhis2/app-runtime';
import { supportsEncryptedRouteAuth } from './routeToken';
import { routeTokenReentryMessage } from './routeMutation';
import i18n from '@dhis2/d2-i18n';
import { Checkbox, InputField, NoticeBox } from '@dhis2/ui';
import styles from './ApiTokenField.module.css';

type Props = {
    value: string;
    onChange: (value: string) => void;
    configured: boolean;
    reentryRequired?: boolean;
    remove: boolean;
    onRemoveChange: (remove: boolean) => void;
    disabled: boolean;
    error?: string;
};

export const ApiTokenField = ({ value, onChange, configured, reentryRequired, remove, onRemoveChange, disabled, error }: Props) => {
    const { serverVersion } = useConfig();
    const encrypted = supportsEncryptedRouteAuth(serverVersion);
    return (
        <div className={styles.container}>
            <InputField
                name="apiToken"
                label={reentryRequired ? i18n.t('CHAP API token') : i18n.t('CHAP API token (optional)')}
                type="password"
                autoComplete="new-password"
                value={value}
                onChange={({ value }) => onChange(value ?? '')}
                disabled={disabled || remove}
                error={!!error}
                validationText={error}
                helpText={reentryRequired
                    ? routeTokenReentryMessage()
                    : configured
                        ? i18n.t('A token is configured. Leave blank to keep it, or enter a new token to replace it.')
                        : i18n.t('Enter the token configured on your CHAP server. Leave blank if the server does not require one.')}
                dataTest="route-api-token-input"
            />
            {encrypted ? (
                <p className={styles.help}>
                    {i18n.t('New tokens are stored encrypted in DHIS2. Existing plain-text tokens remain readable until replaced.')}
                </p>
            ) : (
                <NoticeBox warning title={i18n.t('API tokens will be stored in plain text')}>
                    {i18n.t('This DHIS2 version stores new tokens in plain route headers. Users who can read the route configuration can access them. Upgrade DHIS2 to store tokens encrypted.')}
                </NoticeBox>
            )}
            {configured && (
                <Checkbox
                    label={i18n.t('Remove saved API token')}
                    checked={remove}
                    onChange={({ checked }) => onRemoveChange(checked)}
                    disabled={disabled}
                    dataTest="remove-route-api-token"
                />
            )}
        </div>
    );
};
