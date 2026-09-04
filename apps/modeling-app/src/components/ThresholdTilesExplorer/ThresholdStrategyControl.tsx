import { useEffect, useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    InputField,
    NoticeBox,
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
    type ThresholdParams,
    type ThresholdParamsFormErrors,
    type ThresholdParamsFormValues,
    type ThresholdStrategyId,
} from '@/utils/thresholdStrategyParams';
import styles from './ThresholdStrategyControl.module.css';

type Props = {
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

    const applyParams = (nextStrategy: ThresholdStrategyId) => {
        const result = parseThresholdParams(nextStrategy, formValues);
        setErrors(result.errors ?? {});
        if (result.params) {
            onApply(result.params);
        }
    };

    const handleStrategyChange = (selected: string) => {
        if (!isKnownThresholdStrategy(selected)) {
            return;
        }
        setStrategy(selected);

        const result = parseThresholdParams(selected, formValues);
        if (result.params) {
            setErrors({});
            onApply(result.params);
            return;
        }

        // Stale invalid edits for the selected strategy: reset its fields to
        // the defaults and apply those, so the select never shows a strategy
        // while another one's params stay applied.
        const defaults = getDefaultThresholdParams(selected);
        const defaultFormValues = paramsToFormValues(defaults);
        setFormValues(previous => (
            selected === 'seasonal'
                ? { ...previous, stdMultiplier: defaultFormValues.stdMultiplier }
                : {
                        ...previous,
                        lowerPercentile: defaultFormValues.lowerPercentile,
                        upperPercentile: defaultFormValues.upperPercentile,
                        baselineYears: defaultFormValues.baselineYears,
                    }
        ));
        setErrors({});
        onApply(defaults);
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
                <NoticeBox error title={i18n.t('Unable to load threshold strategies')}>
                    <div className={styles.strategiesErrorContent}>
                        {i18n.t('The strategy options could not be loaded, so the strategy cannot be changed.')}
                        <Button small onClick={() => refetchStrategies()}>
                            {i18n.t('Retry')}
                        </Button>
                    </div>
                </NoticeBox>
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
                        onClick={() => applyParams(strategy)}
                        dataTest="threshold-params-apply-button"
                    >
                        {i18n.t('Apply')}
                    </Button>
                </div>
            )}
        </div>
    );
};
