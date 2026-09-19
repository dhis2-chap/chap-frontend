import type { ModelSpecRead, ModelTemplateRead } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';

// Keep the generated client unchanged until configured-models exposes this field.
export type ModelWithHealth = ModelSpecRead & { healthStatus?: string | null };

export const getModelHealth = (model?: ModelSpecRead): string | null | undefined =>
    (model as ModelWithHealth | undefined)?.healthStatus;

export const hasRevisionMismatch = (model?: ModelSpecRead): boolean =>
    getModelHealth(model) === 'revision_mismatch';

export const revisionMismatchMessage = () => i18n.t(
    'This model cannot run because its service revision differs from the stored version. The model developer must publish a new version before it can run. Select another model or contact the model developer.',
);

export const needsTemplateHealth = (model: ModelWithHealth): boolean =>
    model.healthStatus === undefined && model.usesChapkit === true && !!model.version;

export const addTemplateHealth = (
    models: ModelWithHealth[],
    templates: ModelTemplateRead[],
): ModelWithHealth[] => models.map((model) => {
    // A direct value (including null or an unknown future status) is authoritative.
    if (!needsTemplateHealth(model)) return model;

    // Legacy configured models have no template ID. Only join an unambiguous
    // canonical name + version; never apply another version's health to a model.
    const matches = templates.filter(template =>
        template.usesChapkit === true &&
        template.version === model.version &&
        (model.name === template.name || model.name.startsWith(`${template.name}:`)),
    );
    if (matches.length !== 1) return model;

    return { ...model, healthStatus: matches[0].healthStatus };
});
