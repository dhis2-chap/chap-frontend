import type { ModelSpecRead, ModelTemplateRead } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';

// Only model templates carry a health status. Configured models inherit it from
// their template, so the listing joins it in and the rest of the app reads it here.
export type ModelWithHealth = ModelSpecRead & { healthStatus?: string | null };

export const hasRevisionMismatch = (model?: ModelSpecRead): boolean =>
    (model as ModelWithHealth | undefined)?.healthStatus === 'revision_mismatch';

export const revisionMismatchMessage = () => i18n.t(
    'This model cannot run because its service revision differs from the stored version. The model developer must publish a new version before it can run. Select another model or contact the model developer.',
);

export const hasTemplateHealth = (model: ModelSpecRead): boolean =>
    model.usesChapkit === true && !!model.version;

export const addTemplateHealth = (
    models: ModelSpecRead[],
    templates: ModelTemplateRead[],
): ModelWithHealth[] => models.map((model) => {
    if (!hasTemplateHealth(model)) return model;

    // Configured models do not expose their template ID, so join on the canonical
    // name + version. Only an unambiguous match counts: never apply another
    // version's health to a model.
    const matches = templates.filter(template =>
        template.usesChapkit === true &&
        template.version === model.version &&
        (model.name === template.name || model.name.startsWith(`${template.name}:`)),
    );
    if (matches.length !== 1) return model;

    return { ...model, healthStatus: matches[0].healthStatus };
});
