import { useConfig } from '@dhis2/app-runtime';
import { supportsEncryptedRouteAuth } from './routeToken';
import { routeTokenReentryMessage, unsupportedRouteTokenMessage } from './routeMutation';
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
    const removeCheckbox = configured && (
        <Checkbox
            label={i18n.t('Remove saved API token')}
            checked={remove}
            onChange={({ checked }) => onRemoveChange(checked)}
            disabled={disabled}
            dataTest="remove-route-api-token"
        />
    );

    if (!encrypted) {
        return (
            <div className={styles.container}>
                <NoticeBox warning title={i18n.t('Setting API tokens is not supported on this DHIS2 version')} dataTest="route-api-token-unsupported">
                    {unsupportedRouteTokenMessage()}
                </NoticeBox>
                {removeCheckbox}
            </div>
        );
    }

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
            <p className={styles.help}>
                {i18n.t('New tokens are stored encrypted in DHIS2. Existing plain-text tokens remain readable until replaced.')}
            </p>
            {removeCheckbox}
        </div>
    );
};
