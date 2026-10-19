import { useId } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, Field } from '@dhis2/ui';
import { ALERT_COLORS, getAlertColor, type AlertColor } from './alertLevelDisplay';
import styles from './BackendAlerts.module.css';

export const AlertColorSelect = ({ value, onChange, disabled, label }: {
    value: AlertColor;
    onChange: (value: AlertColor) => void;
    disabled?: boolean;
    label?: string;
}) => {
    const id = useId();
    return (
        <Field label={label ?? i18n.t('Colour')} name={id} disabled={disabled} dataTest="alert-colour-picker">
            <div className={styles.colorPresets}>
                {Object.entries(ALERT_COLORS).map(([key, option]) => (
                    <Button
                        key={key}
                        small
                        aria-label={option.label}
                        title={option.label}
                        aria-pressed={value === key}
                        toggled={value === key}
                        disabled={disabled}
                        onClick={() => onChange(key)}
                        icon={<span className={styles.colorSwatch} style={{ background: option.color }} />}
                    />
                ))}
            </div>
            <label className={styles.customColor}>
                <input
                    id={id}
                    type="color"
                    aria-label={i18n.t('Custom colour')}
                    value={getAlertColor(value).color}
                    disabled={disabled}
                    onChange={event => onChange(event.target.value)}
                />
                <span>{value.startsWith('#') ? value.toUpperCase() : i18n.t('Custom colour')}</span>
            </label>
        </Field>
    );
};
