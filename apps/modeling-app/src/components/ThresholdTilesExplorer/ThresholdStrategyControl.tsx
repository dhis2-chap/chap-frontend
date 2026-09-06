import { useEffect, useMemo, useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    InputField,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui';
import { useThresholdStrategies } from '@/hooks/useThresholdStrategies';
import {
    areThresholdParamsEqual,
    getDefaultThresholdParams,
    isKnownThresholdStrategy,
    paramsToFormValues,
    parseThresholdParams,
    withStrategyFormValues,
    type ThresholdParams,
    type ThresholdParamsFormErrors,
    type ThresholdParamsFormValues,
    type ThresholdStrategyId,
} from '@/utils/thresholdStrategyParams';
import { ErrorNoticeWithRetry } from './ErrorNoticeWithRetry';
import styles from './ThresholdStrategyControl.module.css';

type Props = {
    // The currently applied params. Edits stay local until Apply (or a
    // strategy switch) commits them through onApply; a value changed by the
    // parent from elsewhere replaces the local edits for its strategy.
    value: ThresholdParams;
    onApply: (params: ThresholdParams) => void;
    onDirtyChange?: (isDirty: boolean) => void;
    disabled?: boolean;
};

export const ThresholdStrategyControl = ({
    value,
    onApply,
    onDirtyChange,
    disabled,
}: Props) => {
    const [strategy, setStrategy] = useState<ThresholdStrategyId>(value.type);
    const [formValues, setFormValues] = useState<ThresholdParamsFormValues>(
        () => paramsToFormValues(value),
    );
    const [errors, setErrors] = useState<ThresholdParamsFormErrors>({});
    const lastAppliedRef = useRef(value);
    const appliedByStrategyRef = useRef<Partial<Record<ThresholdStrategyId, ThresholdParams>>>({
        [value.type]: value,
    });
    const {
        thresholdStrategies,
        isLoading: isStrategiesLoading,
        error: strategiesError,
        refetch: refetchStrategies,
    } = useThresholdStrategies();
    const selectedStrategyInfo = thresholdStrategies?.find(
        strategyInfo => strategyInfo.id === strategy,
    );

    const isDirty = useMemo(() => {
        const { params } = parseThresholdParams(strategy, formValues);

        return !params || !areThresholdParamsEqual(params, value);
    }, [strategy, formValues, value]);

    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    useEffect(() => {
        appliedByStrategyRef.current[value.type] = value;
        if (areThresholdParamsEqual(value, lastAppliedRef.current)) {
            return;
        }

        // The parent changed the params outside this control: mirror them.
        lastAppliedRef.current = value;
        setStrategy(value.type);
        setFormValues(previous => withStrategyFormValues(previous, value));
        setErrors({});
    }, [value]);

    const commitParams = (params: ThresholdParams) => {
        lastAppliedRef.current = params;
        appliedByStrategyRef.current[params.type] = params;
        onApply(params);
    };

    const applyParams = () => {
        const result = parseThresholdParams(strategy, formValues);
        setErrors(result.errors ?? {});
        if (result.params) {
            commitParams(result.params);
        }
    };

    const handleStrategyChange = (selected: string) => {
        if (!isKnownThresholdStrategy(selected)) {
            return;
        }

        // Switching commits the params last applied for the selected strategy
        // (or its defaults), never edits that were typed but not applied, so
        // the select never shows a strategy while another one's params stay
        // applied and no unreviewed values are committed.
        const nextParams = appliedByStrategyRef.current[selected] ?? getDefaultThresholdParams(selected);
        setStrategy(selected);
        setFormValues(previous => withStrategyFormValues(previous, nextParams));
        setErrors({});
        commitParams(nextParams);
    };

    const handleFieldChange = (field: keyof ThresholdParamsFormValues) => (
        { value: fieldValue }: { value?: string },
    ) => {
        setFormValues(previous => ({ ...previous, [field]: fieldValue ?? '' }));
        setErrors(previous => ({ ...previous, [field]: undefined }));
    };

    return (
        <div className={styles.container}>
            <SingleSelectField
                dense
                disabled={disabled}
                loading={isStrategiesLoading}
                label={i18n.t('Threshold strategy')}
                helpText={selectedStrategyInfo?.description}
                // Only pass selected once its option exists; an unmatched
                // selected value makes SingleSelect throw in dev builds.
                selected={selectedStrategyInfo ? strategy : undefined}
                onChange={({ selected }) => handleStrategyChange(selected)}
                dataTest="threshold-strategy-select"
            >
                {thresholdStrategies?.map(strategyInfo => (
                    <SingleSelectOption
                        key={strategyInfo.id}
                        value={strategyInfo.id}
                        label={strategyInfo.displayName}
                    />
                ))}
            </SingleSelectField>
            {!!strategiesError && !thresholdStrategies && (
                <ErrorNoticeWithRetry
                    title={i18n.t('Unable to load threshold strategies')}
                    onRetry={() => refetchStrategies()}
                >
                    {i18n.t('The strategy options could not be loaded, so the strategy cannot be changed.')}
                </ErrorNoticeWithRetry>
            )}
            {strategy === 'seasonal' && (
                <InputField
                    dense
                    disabled={disabled}
                    type="number"
                    label={i18n.t('Standard deviations above mean')}
                    value={formValues.stdMultiplier}
                    error={!!errors.stdMultiplier}
                    validationText={errors.stdMultiplier}
                    onChange={handleFieldChange('stdMultiplier')}
                    dataTest="threshold-std-multiplier-input"
                />
            )}
            {strategy === 'percentile' && (
                <>
                    <div className={styles.percentileRow}>
                        <InputField
                            dense
                            disabled={disabled}
                            type="number"
                            label={i18n.t('Lower percentile (%)')}
                            value={formValues.lowerPercentile}
                            error={!!errors.lowerPercentile}
                            validationText={errors.lowerPercentile}
                            onChange={handleFieldChange('lowerPercentile')}
                            dataTest="threshold-lower-percentile-input"
                        />
                        <InputField
                            dense
                            disabled={disabled}
                            type="number"
                            label={i18n.t('Upper percentile (%)')}
                            value={formValues.upperPercentile}
                            error={!!errors.upperPercentile}
                            validationText={errors.upperPercentile}
                            onChange={handleFieldChange('upperPercentile')}
                            dataTest="threshold-upper-percentile-input"
                        />
                    </div>
                    <InputField
                        dense
                        disabled={disabled}
                        type="number"
                        label={i18n.t('Baseline years')}
                        helpText={i18n.t('Leave empty to use all available history')}
                        value={formValues.baselineYears}
                        error={!!errors.baselineYears}
                        validationText={errors.baselineYears}
                        onChange={handleFieldChange('baselineYears')}
                        dataTest="threshold-baseline-years-input"
                    />
                </>
            )}
            {isDirty && (
                <div className={styles.applyRow}>
                    <Button
                        small
                        disabled={disabled}
                        onClick={applyParams}
                        dataTest="threshold-params-apply-button"
                    >
                        {i18n.t('Apply')}
                    </Button>
                </div>
            )}
        </div>
    );
};
