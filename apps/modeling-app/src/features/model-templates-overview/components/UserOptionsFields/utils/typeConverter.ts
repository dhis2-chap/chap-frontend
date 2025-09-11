import { UserOptionConfig } from '../UserOptionsFields';

// Constants (re-exported from main component)
const FIELD_TYPES = {
    INTEGER: 'integer',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
    STRING: 'string',
    ARRAY: 'array',
    NULL: 'null',
} as const;

// Unified Type Converter
export const TypeConverter = {
    getDefault: (option: UserOptionConfig): any => {
        if (option.default !== undefined) {
            return option.default;
        }

        const type = option.type;
        if (type === FIELD_TYPES.INTEGER || type === FIELD_TYPES.NUMBER) return 0;
        if (type === FIELD_TYPES.BOOLEAN) return false;
        if (type === FIELD_TYPES.ARRAY) return [];
        if (type === FIELD_TYPES.STRING) return '';

        if (option.anyOf) {
            // Handle nullable types - default to null if null is an option
            const hasNull = option.anyOf.some(typeOption => typeOption.type === FIELD_TYPES.NULL);
            if (hasNull) return null;

            // Otherwise use the first non-null type's default
            const firstType = option.anyOf.find(typeOption => typeOption.type !== FIELD_TYPES.NULL);
            if (firstType?.type === FIELD_TYPES.INTEGER || firstType?.type === FIELD_TYPES.NUMBER) return 0;
            if (firstType?.type === FIELD_TYPES.BOOLEAN) return false;
            if (firstType?.type === FIELD_TYPES.STRING) return '';
        }

        return null;
    },

    convertInput: (value: string, option: UserOptionConfig): any => {
        const type = option.type;

        if (type === FIELD_TYPES.INTEGER) {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? 0 : parsed;
        }

        if (type === FIELD_TYPES.NUMBER) {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        }

        if (type === FIELD_TYPES.BOOLEAN) {
            return value === 'true';
        }

        if (option.anyOf) {
            // Handle nullable types
            if (value === '' || value === null || value === 'null') return null;

            const integerType = option.anyOf.find(typeOption => typeOption.type === FIELD_TYPES.INTEGER);
            const numberType = option.anyOf.find(typeOption => typeOption.type === FIELD_TYPES.NUMBER);

            if (integerType) {
                const parsed = parseInt(value, 10);
                return isNaN(parsed) ? null : parsed;
            }

            if (numberType) {
                const parsed = parseFloat(value);
                return isNaN(parsed) ? null : parsed;
            }
        }

        return value;
    },
};
