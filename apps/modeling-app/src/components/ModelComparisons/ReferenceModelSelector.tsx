import i18n from '@dhis2/d2-i18n';
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import type { ReferenceModelResult } from '@dhis2-chap/ui';
import { referenceLabel } from './referenceModels';
import styles from './ModelComparisons.module.css';

type Props = {
    references: ReferenceModelResult[];
    reference?: ReferenceModelResult;
    onSelect: (id: string) => void;
    label?: string;
    hideNone?: boolean;
};

export const ReferenceModelSelector = ({ references, reference, onSelect, label = i18n.t('Compare with'), hideNone }: Props) => {
    const unscored = reference !== undefined && reference.status !== 'done';
    return (
        <SingleSelectField
            dense
            className={styles.controls}
            label={label}
            selected={reference ? String(reference.configuredModel.id) : hideNone ? undefined : 'none'}
            onChange={({ selected }) => onSelect(selected)}
            warning={unscored}
            validationText={unscored ? reference.message || i18n.t('No scores for this model yet.') : undefined}
        >
            {!hideNone && <SingleSelectOption value="none" label={i18n.t('No comparison')} />}
            {references.map(item => (
                <SingleSelectOption key={item.configuredModel.id} value={String(item.configuredModel.id)} label={referenceLabel(item)} />
            ))}
        </SingleSelectField>
    );
};
