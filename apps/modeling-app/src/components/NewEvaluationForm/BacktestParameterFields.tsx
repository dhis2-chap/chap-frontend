import i18n from '@dhis2/d2-i18n';
import { Button, InputField, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import type { BacktestParameters } from './hooks/backtestParameters';
import { useWeatherProviders } from '@/hooks/useWeatherProviders';
import { ChapErrorNotice } from '../ChapErrorNotice';
import styles from './BacktestParameterFields.module.css';

type Props = {
    disabled?: boolean;
};

export const BacktestParameterFields = ({ disabled }: Props) => {
    const { control } = useFormContext<{ backtestParameters: BacktestParameters }>();
    const [nSplits, providerId] = useWatch({ control, name: ['backtestParameters.nSplits', 'backtestParameters.futureWeatherProvider'] });
    const providers = useWeatherProviders();
    const provider = providers.data?.find(item => item.id === providerId);
    const counts = [
        { name: 'nPeriods', label: i18n.t('Forecast periods'), helpText: i18n.t('Number of periods to forecast at each split.') },
        { name: 'nSplits', label: i18n.t('Number of splits'), helpText: i18n.t('Total number of rolling train/test splits.') },
        { name: 'stride', label: i18n.t('Stride'), helpText: i18n.t('Number of periods to advance between successive splits.') },
        { name: 'nRetrain', label: i18n.t('Number of retrains'), helpText: i18n.t('Retrains are evenly spaced across the splits. One means train once.') },
    ] as const;

    return (
        <fieldset className={styles.container}>
            <legend>{i18n.t('Backtest parameters')}</legend>
            <div className={styles.counts}>
                {counts.map(({ name, label, helpText }) => (
                    <Controller
                        key={name}
                        name={`backtestParameters.${name}`}
                        control={control}
                        render={({ field, fieldState }) => (
                            <InputField
                                name={field.name}
                                label={label}
                                helpText={helpText}
                                type="number"
                                min="1"
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
                        label={i18n.t('Future-weather provider')}
                        selected={provider ? field.value : ''}
                        onChange={({ selected }) => field.onChange(selected)}
                        onBlur={field.onBlur}
                        disabled={disabled || providers.isLoading || !!providers.error}
                        loading={providers.isLoading}
                        helpText={provider?.description}
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
