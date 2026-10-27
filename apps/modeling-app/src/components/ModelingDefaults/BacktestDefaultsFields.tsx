import { BacktestParameterInfo, WeatherProviderInfo } from '@dhis2-chap/ui';
import { InputField, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Controller, useFormContext } from 'react-hook-form';
import type { ModelingDefaultsValues } from './ModelingDefaults';
import styles from './ModelingDefaults.module.css';

type Props = {
    name: 'weeklyBacktestParams' | 'monthlyBacktestParams';
    label: string;
    parameters: BacktestParameterInfo[];
    providers: WeatherProviderInfo[];
    disabled: boolean;
};

export const BacktestDefaultsFields = ({ name, label, parameters, providers, disabled }: Props) => {
    const { control, watch } = useFormContext<ModelingDefaultsValues>();
    const values = watch(name);
    const provider = providers.find(item => item.id === values.futureWeatherProvider);
    const providerParameter = parameters.find(item => item.name === 'futureWeatherProvider');

    return (
        <section className={styles.section}>
            <h3>{label}</h3>
            <div className={styles.counts}>
                {(['nPeriods', 'nSplits', 'stride', 'nRetrain'] as const).map((key) => {
                    const parameter = parameters.find(item => item.name === key);
                    return (
                        <Controller
                            key={key}
                            name={`${name}.${key}`}
                            control={control}
                            render={({ field, fieldState }) => (
                                <InputField
                                    label={parameter?.label ?? key}
                                    helpText={parameter?.description}
                                    name={field.name}
                                    type="number"
                                    min={String(parameter?.minimum ?? 1)}
                                    max={key === 'nRetrain' && Number.isFinite(values.nSplits) ? String(values.nSplits) : undefined}
                                    step="1"
                                    value={Number.isFinite(field.value) ? String(field.value) : ''}
                                    onChange={({ value }) => field.onChange(value === '' ? NaN : Number(value))}
                                    onBlur={field.onBlur}
                                    disabled={disabled}
                                    error={!!fieldState.error}
                                    validationText={fieldState.error?.message}
                                    dataTest={`${name}-${key}`}
                                />
                            )}
                        />
                    );
                })}
            </div>
            <Controller
                name={`${name}.futureWeatherProvider`}
                control={control}
                render={({ field, fieldState }) => (
                    <SingleSelectField
                        label={providerParameter?.label ?? i18n.t('Future-weather provider')}
                        selected={field.value}
                        onChange={({ selected }) => field.onChange(selected)}
                        onBlur={field.onBlur}
                        disabled={disabled}
                        helpText={provider?.description ?? providerParameter?.description}
                        error={!!fieldState.error}
                        validationText={fieldState.error?.message}
                        dataTest={`${name}-futureWeatherProvider`}
                    >
                        {!provider && <SingleSelectOption value={field.value} label={field.value} />}
                        {providers.map(item => <SingleSelectOption key={item.id} value={item.id} label={item.displayName} />)}
                    </SingleSelectField>
                )}
            />
            {provider?.leaksFutureData && <NoticeBox warning>{i18n.t('This provider uses observed future weather. Its evaluation scores are not comparable to production performance, and it cannot be used for future predictions.')}</NoticeBox>}
        </section>
    );
};
