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

const INTERNAL_FIELD_TYPES = {
    ARRAY: 'array',
    ENUM: 'enum',
    BOOLEAN: 'boolean',
    NULLABLE: 'nullable',
    DEFAULT: 'default',
} as const;

// Field Handler Mapping type
export const fieldHandlers = {
    [INTERNAL_FIELD_TYPES.ARRAY]: 'renderArrayField',
    [INTERNAL_FIELD_TYPES.ENUM]: 'renderEnumField',
    [INTERNAL_FIELD_TYPES.BOOLEAN]: 'renderBooleanField',
    [INTERNAL_FIELD_TYPES.NULLABLE]: 'renderNullableField',
    [INTERNAL_FIELD_TYPES.DEFAULT]: 'renderDefaultField',
} as const;

// Field Type Detection
export const getFieldType = (optionConfig: UserOptionConfig): keyof typeof fieldHandlers => {
    if (optionConfig.type === FIELD_TYPES.ARRAY) return INTERNAL_FIELD_TYPES.ARRAY;
    if (optionConfig.enum && optionConfig.enum.length > 0) return INTERNAL_FIELD_TYPES.ENUM;
    if (optionConfig.type === FIELD_TYPES.BOOLEAN) return INTERNAL_FIELD_TYPES.BOOLEAN;
    if (optionConfig.anyOf?.some(typeOption => typeOption.type === FIELD_TYPES.NULL)) return INTERNAL_FIELD_TYPES.NULLABLE;
    return INTERNAL_FIELD_TYPES.DEFAULT;
};
