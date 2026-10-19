import i18n from '@dhis2/d2-i18n';
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { ALERT_COLORS, alertColorSchema, type AlertColor } from './alertLevelDisplay';

export const AlertColorSelect = ({ value, onChange, disabled }: {
    value: AlertColor;
    onChange: (value: AlertColor) => void;
    disabled?: boolean;
}) => (
    <SingleSelectField
        dense
        label={i18n.t('Colour')}
        selected={value}
        disabled={disabled}
        onChange={({ selected }) => onChange(alertColorSchema.parse(selected))}
    >
        {Object.entries(ALERT_COLORS).map(([key, option]) => (
            <SingleSelectOption key={key} value={key} label={option.label} />
        ))}
    </SingleSelectField>
);
