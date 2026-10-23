import { useId } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, Field } from '@dhis2/ui';
import { ALERT_COLORS, PRESET_COLORS, getAlertColor, type AlertColor } from '@dhis2-chap/ui';
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
                {PRESET_COLORS.map(key => (
                    <Button
                        key={key}
                        small
                        aria-label={ALERT_COLORS[key].label}
                        title={ALERT_COLORS[key].label}
                        aria-pressed={value === key}
                        toggled={value === key}
                        disabled={disabled}
                        onClick={() => onChange(key)}
                        icon={<span className={styles.colorSwatch} style={{ background: ALERT_COLORS[key].color }} />}
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
