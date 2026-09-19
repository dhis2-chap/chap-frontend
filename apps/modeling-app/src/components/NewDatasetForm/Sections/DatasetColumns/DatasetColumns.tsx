import i18n from '@dhis2/d2-i18n';
import cn from 'classnames';
import {
    Button,
    IconAdd16,
    IconDelete16,
    InputField,
    Label,
} from '@dhis2/ui';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { SearchSelectField } from '@/features/search-dataitem/SearchSelectField';
import { EMPTY_COLUMN, type DatasetFormValues } from '../../hooks/useDatasetFormState';
import styles from './DatasetColumns.module.css';

export const DatasetColumns = () => {
    const { control, setValue, formState: { errors } } = useFormContext<DatasetFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name: 'columns' });

    return (
        <div className={cn(styles.formField, styles.datasetColumns)}>
            <Label>{i18n.t('Data columns')}</Label>
            <p className={styles.mutedText}>
                {i18n.t('Name each column the way your models expect it, for example disease_cases.')}
            </p>

            {fields.map((field, index) => (
                <div className={styles.column} key={field.id}>
                    <div className={styles.columnField}>
                        <Controller
                            control={control}
                            name={`columns.${index}.covariateName`}
                            render={({ field: covariateName }) => (
                                <InputField
                                    label={i18n.t('Covariate name')}
                                    value={covariateName.value}
                                    onChange={({ value }) => covariateName.onChange(value ?? '')}
                                    error={!!errors.columns?.[index]?.covariateName}
                                    validationText={errors.columns?.[index]?.covariateName?.message}
                                    required
                                />
                            )}
                        />
                    </div>
                    <div className={styles.columnField}>
                        <SearchSelectField
                            feature={{ id: field.id, name: '', displayName: i18n.t('Data item'), description: '' }}
                            defaultValue={field.dataItem}
                            onChangeSearchSelectField={(_, id, displayName, dimensionItemType) => {
                                setValue(`columns.${index}.dataItem`, { id, displayName, dimensionItemType }, { shouldValidate: true, shouldDirty: true });
                            }}
                            onResetField={() => setValue(`columns.${index}.dataItem`, EMPTY_COLUMN.dataItem, { shouldValidate: true, shouldDirty: true })}
                        />
                        {errors.columns?.[index]?.dataItem && (
                            <p className={styles.errorText}>{i18n.t('Select a data item')}</p>
                        )}
                    </div>
                    <Button
                        small
                        className={styles.removeButton}
                        icon={<IconDelete16 />}
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                    >
                        {i18n.t('Remove')}
                    </Button>
                </div>
            ))}

            <Button small icon={<IconAdd16 />} onClick={() => append({ ...EMPTY_COLUMN })}>
                {i18n.t('Add column')}
            </Button>

            {(errors.columns?.root?.message || errors.columns?.message) && (
                <p className={styles.errorText}>
                    {errors.columns.root?.message || errors.columns.message}
                </p>
            )}
        </div>
    );
};
