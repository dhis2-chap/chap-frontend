import { z, ZodTypeAny } from 'zod';

type JsonSchemaLike = {
    type?: string;
    default?: unknown;
    description?: string;
    title?: string;
    enum?: string[];
    items?: JsonSchemaLike;
    minimum?: number;
    maximum?: number;
    minItems?: number;
    maxItems?: number;
    anyOf?: JsonSchemaLike[];
};

const isJsonSchemaObject = (value: unknown): value is JsonSchemaLike => {
    return typeof value === 'object' && value !== null;
};

const isStringArray = (arr: unknown[]): arr is [string, ...string[]] => {
    return arr.length > 0 && arr.every(option => typeof option === 'string');
};

const buildEnumSchema = (config: JsonSchemaLike, baseType: string | undefined): ZodTypeAny => {
    if (!Array.isArray(config.enum) || config.enum.length === 0) {
        return buildPrimitiveSchema(baseType, config);
    }

    if (isStringArray(config.enum)) {
        const [first, ...rest] = config.enum;
        return z.enum([first, ...rest]);
    }

    return z.any();
};

const buildArraySchema = (config: JsonSchemaLike) => {
    const itemSchema = config.items ? buildSchemaForOption(config.items) : z.any();

    let schema = z.array(itemSchema);

    if (typeof config.minItems === 'number') {
        schema = schema.min(config.minItems);
    }
    if (typeof config.maxItems === 'number') {
        schema = schema.max(config.maxItems);
    }

    return schema;
};

const buildPrimitiveSchema = (type: string | undefined, config: JsonSchemaLike): ZodTypeAny => {
    switch (type) {
        case 'string':
            return z.string();
        case 'number': {
            let schema = z.coerce.number({
                invalid_type_error: 'Must be a valid number',
            });
            if (typeof config.minimum === 'number') {
                schema = schema.min(config.minimum);
            }
            if (typeof config.maximum === 'number') {
                schema = schema.max(config.maximum);
            }
            return schema;
        }
        case 'integer': {
            let schema = z.coerce.number({
                invalid_type_error: 'Must be a valid integer',
            }).int('Must be an integer');
            if (typeof config.minimum === 'number') {
                schema = schema.min(config.minimum);
            }
            if (typeof config.maximum === 'number') {
                schema = schema.max(config.maximum);
            }
            return schema;
        }
        case 'boolean':
            return z.boolean();
        case 'array':
            return buildArraySchema(config);
        case 'null':
            return z.null();
        default:
            return z.any();
    }
};

const resolveType = (config: JsonSchemaLike): string | undefined => {
    // If the config has a direct type, use it
    if (config.type) {
        return config.type;
    }

    // If the config has anyOf, extract the first non-null type
    if (Array.isArray(config.anyOf) && config.anyOf.length > 0) {
        const firstNonNull = config.anyOf.find(option => option.type !== 'null');
        return firstNonNull?.type;
    }

    return undefined;
};

const isNullable = (config: JsonSchemaLike): boolean => {
    // Check if anyOf contains a null type
    if (Array.isArray(config.anyOf)) {
        return config.anyOf.some(option => option.type === 'null');
    }
    return false;
};

const buildSchemaForOption = (config: JsonSchemaLike): ZodTypeAny => {
    if (Array.isArray(config.enum) && config.enum.length > 0) {
        return buildEnumSchema(config, config.type);
    }

    const type = resolveType(config);
    let schema = buildPrimitiveSchema(type, config);

    // If the field is nullable (anyOf includes null), make it optional
    if (isNullable(config)) {
        schema = schema.optional().nullable();
    }

    return schema;
};

export const buildUserOptionsSchema = (userOptions: Record<string, unknown> | null | undefined) => {
    if (!userOptions) {
        return null;
    }

    const shapeEntries = Object.entries(userOptions).reduce<Record<string, ZodTypeAny>>((acc, [key, value]) => {
        if (isJsonSchemaObject(value)) {
            acc[key] = buildSchemaForOption(value);
        }
        return acc;
    }, {});

    return z.object(shapeEntries);
};

export const extractUserOptionsDefaults = (userOptions: Record<string, unknown> | null | undefined) => {
    if (!userOptions) {
        return {};
    }

    return Object.entries(userOptions).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (isJsonSchemaObject(value)) {
            acc[key] = value.default ?? undefined;
        }

        return acc;
    }, {});
};

export type UserOptionMetadata = JsonSchemaLike;
