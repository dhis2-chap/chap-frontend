import i18n from '@dhis2/d2-i18n';
import { Checkbox, InputField } from '@dhis2/ui';
import styles from './ApiTokenField.module.css';

type Props = {
    value: string;
    onChange: (value: string) => void;
    configured: boolean;
    remove: boolean;
    onRemoveChange: (remove: boolean) => void;
    disabled: boolean;
    error?: string;
};

export const ApiTokenField = ({ value, onChange, configured, remove, onRemoveChange, disabled, error }: Props) => (
    <div className={styles.container}>
        <InputField
            name="apiToken"
            label={i18n.t('CHAP API token (optional)')}
            type="password"
            autoComplete="new-password"
            value={value}
            onChange={({ value }) => onChange(value ?? '')}
            disabled={disabled || remove}
            error={!!error}
            validationText={error}
            helpText={configured
                ? i18n.t('A token is configured. Leave blank to keep it, or enter a new token to replace it.')
                : i18n.t('Enter the token configured on your CHAP server. Leave blank if the server does not require one.')}
            dataTest="route-api-token-input"
        />
        <p className={styles.help}>
            {i18n.t('The token is saved in the DHIS2 route and sent to CHAP with each request. Users who can read the route configuration can access it.')}
        </p>
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
