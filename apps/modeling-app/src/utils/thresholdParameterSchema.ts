import { z } from 'zod';
import i18n from '@dhis2/d2-i18n';

type Schema = {
    $ref?: string;
    type?: string;
    const?: unknown;
    title?: string;
    description?: string;
    default?: unknown;
    minimum?: number;
    maximum?: number;
    enum?: string[];
    properties?: Record<string, Schema>;
    required?: string[];
    oneOf?: Schema[];
    anyOf?: Schema[];
};

export type ThresholdParameter = {
    name: string;
    label: string;
    description?: string;
    type: 'number' | 'integer' | 'string' | 'boolean';
    nullable: boolean;
    required: boolean;
    defaultValue: unknown;
    minimum?: number;
    maximum?: number;
    options?: string[];
};

export type ThresholdStrategySchema = {
    id: string;
    label: string;
    description?: string;
    fields: ThresholdParameter[];
};

export const parameterLabel = (name: string) => {
    const words = name.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
    return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
};

const schemaError = () => new Error(i18n.t('The CHAP threshold schema is unavailable or unsupported.'));

/** Read the endpoint's discriminated union, including strategy additions unknown to this build. */
export const readThresholdStrategies = (document: unknown): ThresholdStrategySchema[] => {
    const doc = document as {
        paths?: Record<string, { post?: { requestBody?: { content?: Record<string, { schema?: Schema }> } } }>;
        components?: { schemas?: Record<string, Schema> };
    } | null;
    const resolve = (schema?: Schema): Schema => {
        if (!schema) throw schemaError();
        if (!schema.$ref) return schema;
        const prefix = '#/components/schemas/';
        if (!schema.$ref.startsWith(prefix)) throw schemaError();
        const resolved = doc?.components?.schemas?.[schema.$ref.slice(prefix.length)];
        if (!resolved || resolved.$ref) throw schemaError();
        return resolved;
    };
    const request = resolve(doc?.paths?.['/v1/analytics/thresholds']?.post?.requestBody?.content?.['application/json']?.schema);
    const params = resolve(request.properties?.params);
    if (!params.oneOf?.length) throw schemaError();
    return params.oneOf.map((member) => {
        const strategy = resolve(member);
        const type = resolve(strategy.properties?.type);
        const id = type.const ?? type.enum?.[0];
        if (typeof id !== 'string') throw schemaError();
        const fields = Object.entries(strategy.properties ?? {}).filter(([name]) => name !== 'type').map(([name, property]) => {
            const field = resolve(property);
            const variants = (field.anyOf ?? field.oneOf ?? [field]).map(resolve);
            // An alert level must pin one line. Select the scalar branch of scalar | array.
            const scalar = variants.find(variant => ['number', 'integer', 'string', 'boolean'].includes(variant.type ?? ''));
            if (!scalar) throw schemaError();
            return {
                name,
                label: field.title && field.title.toLowerCase() !== name.toLowerCase() ? field.title : parameterLabel(name),
                description: field.description,
                type: scalar.type as ThresholdParameter['type'],
                nullable: variants.some(variant => variant.type === 'null'),
                required: strategy.required?.includes(name) ?? false,
                defaultValue: field.default,
                minimum: scalar.minimum,
                maximum: scalar.maximum,
                options: scalar.enum,
            };
        });
        return { id, label: strategy.title?.endsWith('Params') ? parameterLabel(strategy.title.slice(0, -6)) : strategy.title ?? id, description: strategy.description, fields };
    });
};

export const thresholdParameterDefaults = (strategy: ThresholdStrategySchema): Record<string, string> => (
    Object.fromEntries(strategy.fields.map(field => [field.name, field.defaultValue == null ? '' : String(field.defaultValue)]))
);

export const thresholdParameterValidator = (strategy: ThresholdStrategySchema) => {
    const fields: Record<string, z.ZodTypeAny> = { type: z.literal(strategy.id) };
    for (const field of strategy.fields) {
        let value: z.ZodTypeAny;
        if (field.type === 'number' || field.type === 'integer') {
            let number = z.number({ invalid_type_error: i18n.t('Enter a number') }).finite(i18n.t('Enter a finite number'));
            if (field.type === 'integer') number = number.int(i18n.t('Enter a whole number'));
            if (field.minimum !== undefined) number = number.min(field.minimum, i18n.t('Enter a value of at least {{minimum}}', { minimum: field.minimum }));
            if (field.maximum !== undefined) number = number.max(field.maximum, i18n.t('Enter a value no greater than {{maximum}}', { maximum: field.maximum }));
            value = number;
        } else if (field.type === 'boolean') {
            value = z.boolean();
        } else {
            value = field.options?.length ? z.enum(field.options as [string, ...string[]]) : z.string().min(1);
        }
        if (field.nullable) value = value.nullable();
        if (!field.required) value = value.optional();
        fields[field.name] = z.preprocess((raw) => {
            if (raw === '') return field.nullable ? null : undefined;
            if (typeof raw !== 'string') return raw;
            if (field.type === 'number' || field.type === 'integer') return raw.trim() ? Number(raw) : NaN;
            if (field.type === 'boolean') return raw === 'true' ? true : raw === 'false' ? false : raw;
            return raw;
        }, value);
    }
    return z.object(fields);
};
