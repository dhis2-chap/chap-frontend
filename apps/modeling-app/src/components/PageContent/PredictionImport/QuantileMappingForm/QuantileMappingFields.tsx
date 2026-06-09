import i18n from '@dhis2/d2-i18n';
import type { FieldErrors } from 'react-hook-form';
import { QUANTILE_SUGGESTED_KEYWORDS } from '@/utils/predictionSetupImportMapping';
import { DataItemSelect } from './DataItemSelect';
import type {
    QuantileMappingField,
    QuantileMappingFormValues,
} from './quantileMappingFormSchema';

type Props = {
    values: Record<QuantileMappingField, string | undefined>;
    errors: FieldErrors<QuantileMappingFormValues>;
    onChange: (field: QuantileMappingField, id: string | null) => void;
};

const fieldConfigs: Array<{
    name: QuantileMappingField;
    label: string;
}> = [
    { name: 'quantile_high', label: i18n.t('Quantile high') },
    { name: 'quantile_mid_high', label: i18n.t('Quantile mid high') },
    { name: 'median', label: i18n.t('Median') },
    { name: 'quantile_mid_low', label: i18n.t('Quantile mid low') },
    { name: 'quantile_low', label: i18n.t('Quantile low') },
];

export const QuantileMappingFields = ({ values, errors, onChange }: Props) => (
    <>
        {fieldConfigs.map(({ name, label }) => (
            <DataItemSelect
                key={name}
                label={label}
                value={values[name]}
                onChange={id => onChange(name, id)}
                error={errors[name]?.message}
                dataElementsOnly
                suggestedKeyword={QUANTILE_SUGGESTED_KEYWORDS[name]}
            />
        ))}
    </>
);
