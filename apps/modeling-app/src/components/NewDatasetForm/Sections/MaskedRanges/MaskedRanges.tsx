import { useEffect } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, IconAdd16, IconDelete16, InputField, NoticeBox } from '@dhis2/ui';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { toDhis2FixedPeriodType } from '@dhis2-chap/core';
import { PeriodRangeField } from '@dhis2-chap/ui';
import type { DatasetFormValues } from '../../hooks/useDatasetFormState';
import type { Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import styles from './MaskedRanges.module.css';

type Props = {
    periodSettings: Dhis2PeriodSettings;
};

export const MaskedRanges = ({ periodSettings }: Props) => {
    const { control, setValue, formState: { errors } } = useFormContext<DatasetFormValues>();
    const { fields, append, remove, replace } = useFieldArray({ control, name: 'maskedRanges' });
    const [ranges, periodType] = useWatch({ control, name: ['maskedRanges', 'periodType'] });
    const fixedPeriodType = toDhis2FixedPeriodType(periodType);

    // Ranges use the dataset's period type, so clear them when it changes.
    useEffect(() => replace([]), [periodType, replace]);

    return (
        <section className={styles.section}>
            <h3 className={styles.title}>{i18n.t('Masked ranges')}</h3>
            {fields.length > 0 && (
                <NoticeBox warning title={i18n.t('Masking permanently removes data')}>
                    {i18n.t('Disease case values in these ranges are stored as empty in the saved dataset and cannot be recovered. To change the ranges later, create a new dataset.')}
                </NoticeBox>
            )}
            {fields.map((range, index) => (
                <div key={range.id} className={styles.range}>
                    {fixedPeriodType && (
                        <PeriodRangeField
                            periodType={fixedPeriodType}
                            calendar={periodSettings.calendar}
                            locale={periodSettings.locale}
                            fromLabel={i18n.t('Start period')}
                            toLabel={i18n.t('End period')}
                            fromValue={ranges[index]?.start}
                            toValue={ranges[index]?.end}
                            fromError={errors.maskedRanges?.[index]?.start?.message}
                            toError={errors.maskedRanges?.[index]?.end?.message}
                            fromDataTest={`masked-range-start-${index}`}
                            toDataTest={`masked-range-end-${index}`}
                            onFromChange={period => setValue(`maskedRanges.${index}.start`, period.id, { shouldDirty: true, shouldValidate: true })}
                            onToChange={period => setValue(`maskedRanges.${index}.end`, period.id, { shouldDirty: true, shouldValidate: true })}
                        />
                    )}
                    <div className={styles.nameRow}>
                        <Controller
                            control={control}
                            name={`maskedRanges.${index}.name`}
                            render={({ field }) => (
                                <InputField
                                    className={styles.name}
                                    name={field.name}
                                    label={i18n.t('Name (optional)')}
                                    value={field.value}
                                    onChange={({ value }) => field.onChange(value)}
                                    dataTest={`masked-range-name-${index}`}
                                />
                            )}
                        />
                        <Button
                            small
                            secondary
                            icon={<IconDelete16 />}
                            onClick={() => remove(index)}
                            aria-label={i18n.t('Remove range')}
                            title={i18n.t('Remove range')}
                        />
                    </div>
                </div>
            ))}
            <div>
                <Button small icon={<IconAdd16 />} onClick={() => append({ start: '', end: '', name: '' })}>
                    {i18n.t('Add masked range')}
                </Button>
            </div>
        </section>
    );
};
