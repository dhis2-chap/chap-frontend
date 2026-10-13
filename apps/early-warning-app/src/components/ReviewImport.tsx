import i18n from '@dhis2/d2-i18n';
import { Checkbox, MultiSelectField, MultiSelectOption, NoticeBox } from '@dhis2/ui';

export const ReviewImport = ({ enabled, available, selected, orgUnits, onEnabledChange, onSelectionChange }: {
    enabled: boolean;
    available: boolean;
    selected: string[];
    orgUnits: { id: string; displayName: string }[];
    onEnabledChange: (enabled: boolean) => void;
    onSelectionChange: (selected: string[]) => void;
}) => (
    <>
        <Checkbox
            label={i18n.t('Import forecasts into DHIS2')}
            checked={enabled}
            disabled={!available}
            onChange={({ checked }) => onEnabledChange(checked)}
        />
        {!available && <NoticeBox>{i18n.t('Configure a forecast data-element mapping on the prediction setup in the Modeling App to enable import.')}</NoticeBox>}
        {enabled && available && (
            <MultiSelectField
                label={i18n.t('Organisation units to import')}
                selected={selected}
                onChange={({ selected }) => onSelectionChange(selected)}
            >
                {orgUnits.map(orgUnit => <MultiSelectOption key={orgUnit.id} value={orgUnit.id} label={orgUnit.displayName} />)}
            </MultiSelectField>
        )}
    </>
);
