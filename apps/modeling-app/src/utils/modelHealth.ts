import type { ModelSpecRead } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';

export const hasRevisionMismatch = (model?: ModelSpecRead): boolean =>
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
