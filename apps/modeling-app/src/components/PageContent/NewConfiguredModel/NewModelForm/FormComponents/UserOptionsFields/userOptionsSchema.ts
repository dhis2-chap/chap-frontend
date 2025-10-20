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
            let baseSchema = z.coerce.number({
                invalid_type_error: 'Must be a valid number',
                required_error: 'This field is required',
            });
            if (typeof config.minimum === 'number') {
                baseSchema = baseSchema.min(config.minimum);
            }
            if (typeof config.maximum === 'number') {
                baseSchema = baseSchema.max(config.maximum);
            }
            return z.preprocess(
                (val) => {
                    if (typeof val === 'number') return val;
                    if (typeof val !== 'string') return undefined;
                    if (val.trim() === '') return undefined;

                    return val;
                },
                baseSchema,
            );
        }
        case 'integer': {
            let baseSchema = z.coerce.number({
                invalid_type_error: 'Must be a valid integer',
                required_error: 'This field is required',
            }).int('Must be an integer');
            if (typeof config.minimum === 'number') {
                baseSchema = baseSchema.min(config.minimum);
            }
            if (typeof config.maximum === 'number') {
                baseSchema = baseSchema.max(config.maximum);
            }
            return z.preprocess(
                (val) => {
                    if (typeof val === 'number') return val;
                    if (typeof val !== 'string') return undefined;
                    if (val.trim() === '') return undefined;

                    return val;
                },
                baseSchema,
            );
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
    if (config.type) {
        return config.type;
    }

    if (Array.isArray(config.anyOf) && config.anyOf.length > 0) {
        const firstNonNull = config.anyOf.find(option => option.type !== 'null');
        return firstNonNull?.type;
    }

    return undefined;
};

const isNullable = (config: JsonSchemaLike): boolean => {
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
