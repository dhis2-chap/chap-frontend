import type { ModelSpecRead, ModelTemplateRead } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';

// Only model templates carry a health status. Configured models inherit it from
// their template, so the listing joins it in and the rest of the app reads it here.
export type ModelWithHealth = ModelSpecRead & { healthStatus?: string | null };

export const hasRevisionMismatch = (model?: ModelWithHealth): boolean =>
    model?.healthStatus === 'revision_mismatch';

export const revisionMismatchTooltip = () => i18n.t(
    'This model\'s service changed without a new version number, so it can\'t run.',
);

export const revisionMismatchMessage = (model: ModelSpecRead) => i18n.t(
    'This model\'s service now runs different code than version {{version}} was registered with, so CHAP won\'t run it. Choose another model, or ask your CHAP administrator to redeploy that version or release the change as a new version.',
    { version: model.version },
);

export const revisionMismatchOnSubmitMessage = (model: ModelSpecRead) => i18n.t(
    '{{model}} can no longer run because its service changed after you selected it. Choose another model and try again.',
    { model: model.displayName || model.name },
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
