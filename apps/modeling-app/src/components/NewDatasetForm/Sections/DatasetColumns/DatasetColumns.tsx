import i18n from '@dhis2/d2-i18n';
import {
    Button,
    Chip,
    IconAdd16,
    IconDelete16,
    InputField,
} from '@dhis2/ui';
import { Controller, type UseFieldArrayReturn, useFormContext, useWatch } from 'react-hook-form';
import { SearchSelectField } from '@/features/search-dataitem/SearchSelectField';
import { EMPTY_COLUMN, type DatasetFormValues } from '../../hooks/useDatasetFormState';
import { type CovariateSuggestion } from '../../hooks/useCovariateSuggestions';
import styles from './DatasetColumns.module.css';

type Props = {
    columns: UseFieldArrayReturn<DatasetFormValues, 'columns'>;
    suggestions: CovariateSuggestion[];
    onAddColumn: (covariateName: string) => void;
    /** Data item ids earlier datasets used for each column name, most used first. */
    previousDataItems: Map<string, string[]>;
};

const ColumnHint = ({ name, suggestions }: { name: string; suggestions: CovariateSuggestion[] }) => {
    const trimmed = name.trim();
    if (!trimmed) {
        return null;
    }

    const count = suggestions.find(suggestion => suggestion.name === trimmed)?.models.length ?? 0;
    if (!count) {
        return (
            <p className={styles.warningHint}>
                {i18n.t('No model reads a column with this name. Check the spelling or pick a suggested name.')}
            </p>
        );
    }

    return (
        <p className={styles.hint}>
            {i18n.t('Read by {{count}} models', {
                count,
                defaultValue: 'Read by {{count}} model',
                defaultValue_plural: 'Read by {{count}} models',
            })}
        </p>
    );
};

export const DatasetColumns = ({ columns, suggestions, onAddColumn, previousDataItems }: Props) => {
    const { control, setValue, formState: { errors } } = useFormContext<DatasetFormValues>();
    const values = useWatch({ control, name: 'columns' });
    const { fields, append, remove } = columns;

    const usedNames = values.map(column => column.covariateName.trim());
    const unusedSuggestions = suggestions.filter(suggestion => !usedNames.includes(suggestion.name));
    const columnsError = errors.columns?.root?.message || errors.columns?.message;

    return (
        <section className={styles.section}>
            <div>
                <h3 className={styles.title}>{i18n.t('Data columns')}</h3>
                <p className={styles.description}>
                    {i18n.t('Models find their data by column name, so use the names they expect.')}
                </p>
            </div>

            <div className={styles.columns}>
                {fields.map((field, index) => (
                    <div className={styles.column} key={field.id}>
                        <div className={styles.columnFields}>
                            <Controller
                                control={control}
                                name={`columns.${index}.covariateName`}
                                render={({ field: covariateName }) => (
                                    <InputField
                                        label={i18n.t('Column name')}
                                        value={covariateName.value}
                                        onChange={({ value }) => covariateName.onChange(value ?? '')}
                                        error={!!errors.columns?.[index]?.covariateName}
                                        validationText={errors.columns?.[index]?.covariateName?.message}
                                        dataTest={`dataset-column-name-${index}`}
                                    />
                                )}
                            />
                            <div className={styles.dataItemField}>
                                <SearchSelectField
                                    feature={{ id: field.id, name: '', displayName: i18n.t('DHIS2 data item'), description: '' }}
                                    defaultValue={field.dataItem}
                                    suggestedItemIds={previousDataItems.get(usedNames[index])}
                                    onChangeSearchSelectField={(_, id, displayName, dimensionItemType) => {
                                        setValue(`columns.${index}.dataItem`, { id, displayName, dimensionItemType }, { shouldValidate: true, shouldDirty: true });
                                    }}
                                    onResetField={() => setValue(`columns.${index}.dataItem`, EMPTY_COLUMN.dataItem, { shouldValidate: true, shouldDirty: true })}
                                />
                                {errors.columns?.[index]?.dataItem && (
                                    <p className={styles.errorText}>{i18n.t('Select a data item')}</p>
                                )}
                            </div>
                            <div className={styles.removeButton}>
                                <Button
                                    small
                                    secondary
                                    icon={<IconDelete16 />}
                                    disabled={fields.length === 1}
                                    onClick={() => remove(index)}
                                    aria-label={i18n.t('Remove column')}
                                    title={i18n.t('Remove column')}
                                />
                            </div>
                        </div>
                        <ColumnHint name={values[index]?.covariateName ?? ''} suggestions={suggestions} />
                    </div>
                ))}
            </div>

            {columnsError && <p className={styles.errorText}>{columnsError}</p>}

            <div className={styles.footer}>
                <Button small icon={<IconAdd16 />} onClick={() => append({ ...EMPTY_COLUMN })}>
                    {i18n.t('Add column')}
                </Button>

                {unusedSuggestions.length > 0 && (
                    <div className={styles.suggestions}>
                        <span className={styles.suggestionsLabel}>
                            {i18n.t('Suggested')}
                        </span>
                        {unusedSuggestions.map(suggestion => (
                            <Chip
                                key={suggestion.name}
                                dense
                                onClick={() => onAddColumn(suggestion.name)}
                                dataTest={`dataset-column-suggestion-${suggestion.name}`}
                            >
                                {suggestion.name}
                            </Chip>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};
