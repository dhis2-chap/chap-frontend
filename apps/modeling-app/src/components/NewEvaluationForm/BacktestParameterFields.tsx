import i18n from '@dhis2/d2-i18n';
import { Button, InputField, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { useEffect } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import type { BacktestParameters } from './hooks/backtestParameters';
import { toBacktestDefaults } from './hooks/backtestDefaults';
import { useBacktestParameters } from '@/hooks/useBacktestParameters';
import { useWeatherProviders } from '@/hooks/useWeatherProviders';
import { ChapErrorNotice } from '../ChapErrorNotice';
import styles from './BacktestParameterFields.module.css';

type Props = {
    disabled?: boolean;
};

export const BacktestParameterFields = ({ disabled }: Props) => {
    const { control, resetField } = useFormContext<{ backtestParameters: BacktestParameters }>();
    const [nSplits, providerId] = useWatch({ control, name: ['backtestParameters.nSplits', 'backtestParameters.futureWeatherProvider'] });
    const parameters = useBacktestParameters();
    const providers = useWeatherProviders();
    const provider = providers.data?.find(item => item.id === providerId);
    const counts = parameters.data?.filter(item => item.type === 'integer') ?? [];
    const providerParameter = parameters.data?.find(item => item.name === 'futureWeatherProvider');

    // CHAP Core owns the defaults, so fill them in once they arrive.
    useEffect(() => {
        if (parameters.data) {
            resetField('backtestParameters', { defaultValue: toBacktestDefaults(parameters.data) });
        }
    }, [parameters.data, resetField]);

    if (!parameters.isAvailable) {
        return null;
    }

    return (
        <fieldset className={styles.container}>
            <legend className={styles.legend}>{i18n.t('Backtest parameters')}</legend>
            <div className={styles.counts}>
                {counts.map(({ name, label, description, minimum }) => (
                    <Controller
                        key={name}
                        name={`backtestParameters.${name as 'nPeriods' | 'nSplits' | 'stride' | 'nRetrain'}`}
                        control={control}
                        render={({ field, fieldState }) => (
                            <InputField
                                name={field.name}
                                label={label}
                                helpText={description}
                                type="number"
                                min={minimum != null ? String(minimum) : undefined}
                                step="1"
                                max={name === 'nRetrain' && Number.isFinite(nSplits) ? String(nSplits) : undefined}
                                value={Number.isFinite(field.value) ? String(field.value) : ''}
                                onChange={({ value }) => field.onChange(value === '' ? NaN : Number(value))}
                                onBlur={field.onBlur}
                                disabled={disabled}
                                error={!!fieldState.error}
                                validationText={fieldState.error?.message}
                                dataTest={`backtest-${name}`}
                            />
                        )}
                    />
                ))}
            </div>
            <Controller
                name="backtestParameters.futureWeatherProvider"
                control={control}
                render={({ field, fieldState }) => (
                    <SingleSelectField
                        label={providerParameter?.label}
                        selected={provider ? field.value : ''}
                        onChange={({ selected }) => field.onChange(selected)}
                        onBlur={field.onBlur}
                        disabled={disabled || providers.isLoading || !!providers.error}
                        loading={providers.isLoading}
                        helpText={provider?.description ?? providerParameter?.description}
                        error={!!fieldState.error}
                        validationText={fieldState.error?.message}
                        dataTest="backtest-futureWeatherProvider"
                    >
                        {(providers.data ?? []).map(item => (
                            <SingleSelectOption key={item.id} value={item.id} label={item.displayName} />
                        ))}
                    </SingleSelectField>
                )}
            />
            {parameters.error && (
                <div>
                    <ChapErrorNotice error={parameters.error} title={i18n.t('Could not load backtest parameters')} />
                    <Button small onClick={() => parameters.refetch()}>{i18n.t('Retry')}</Button>
                </div>
            )}
            {providers.error && (
                <div>
                    <ChapErrorNotice error={providers.error} title={i18n.t('Could not load weather providers')} />
                    <Button small onClick={() => providers.refetch()}>{i18n.t('Retry')}</Button>
                </div>
            )}
            {providers.data && !providers.data.length && (
                <NoticeBox warning>{i18n.t('No future-weather providers are available.')}</NoticeBox>
            )}
            {provider?.leaksFutureData && (
                <NoticeBox warning>
                    {i18n.t('This provider uses observed future weather. Its evaluation scores are not comparable to production performance, and it cannot be used for future predictions.')}
                </NoticeBox>
            )}
        </fieldset>
    );
};
