import i18n from '@dhis2/d2-i18n';

export type OutbreakIndicatorDataElement = {
    id: string;
    displayName: string;
    valueType: string;
    optionSet?: { options?: { code: string }[] };
};

const isInteger = (value: string) => /^-?\d+$/.test(value);
const isNumber = (value: string) => /^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(value);

// The DHIS2 aggregate value checks for the types an outbreak indicator can use.
// Other types are rejected; the import's dry run remains the final check.
const valueTypeChecks: Record<string, (value: string) => boolean> = {
    NUMBER: isNumber,
    INTEGER: isInteger,
    INTEGER_POSITIVE: value => isInteger(value) && Number(value) > 0,
    INTEGER_ZERO_OR_POSITIVE: value => isInteger(value) && Number(value) >= 0,
    TEXT: () => true,
    LONG_TEXT: () => true,
};

export const getIncompatibleOutbreakValues = (
    dataElement: OutbreakIndicatorDataElement,
    values: string[],
): string[] => {
    const optionCodes = dataElement.optionSet?.options?.map(option => option.code);
    const isAccepted = optionCodes
        ? (value: string) => optionCodes.includes(value)
        : valueTypeChecks[dataElement.valueType] ?? (() => false);
    return [...new Set(values)].filter(value => !isAccepted(value));
};

export const getOutbreakIndicatorError = (
    dataElement: OutbreakIndicatorDataElement,
    values: string[],
): string | undefined => {
    const incompatible = getIncompatibleOutbreakValues(dataElement, values);
    if (!incompatible.length) return undefined;
    const options = {
        name: dataElement.displayName,
        values: incompatible.join(', '),
        valueType: dataElement.valueType,
    };
    return dataElement.optionSet
        ? i18n.t('{{name}} uses an option set without the codes {{values}}.', options)
        : i18n.t('{{name}} has value type {{valueType}} and cannot store {{values}}.', options);
};
