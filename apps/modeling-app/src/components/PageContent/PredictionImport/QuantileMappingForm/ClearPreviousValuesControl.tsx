import i18n from '@dhis2/d2-i18n';
import { Checkbox } from '@dhis2/ui';
import { ConditionalTooltip } from '@/components/ConditionalTooltip';
import styles from './QuantileMappingForm.module.css';

type Props = {
    checked: boolean;
    canClearPreviousValues: boolean;
    isDeleteAuthorityLoading: boolean;
    onChange: () => void;
};

export const ClearPreviousValuesControl = ({
    checked,
    canClearPreviousValues,
    isDeleteAuthorityLoading,
    onChange,
}: Props) => (
    <div className={styles.clearPreviousValues}>
        <ConditionalTooltip
            enabled={!isDeleteAuthorityLoading && !canClearPreviousValues}
            content={i18n.t('Requires data value delete authority.')}
        >
            <span className={styles.clearPreviousValuesTooltipTarget}>
                <Checkbox
                    label={i18n.t('Clear previous values')}
                    name="clearPreviousValues"
                    checked={checked}
                    onChange={onChange}
                    disabled={!canClearPreviousValues}
                />
            </span>
        </ConditionalTooltip>
    </div>
);
