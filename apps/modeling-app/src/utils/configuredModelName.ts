import i18n from '@dhis2/d2-i18n';

type Named = { name: string };

/** Chap Core names the configured model that tuning picks "<modeling package>:hpo_<id>". */
const TUNED_CONFIGURATION = /^hpo_([0-9a-f]{6})[0-9a-f]*$/;

/** A configured model is named "<modeling package>:<configuration>"; without a configuration it runs the defaults. */
export const getTemplateName = (model: Named) => model.name.split(':')[0];

const getConfigurationStub = (model: Named): string | undefined => model.name.split(':')[1] || undefined;

/** Whether the configuration of a configured model was found by tuning. */
export const isTunedConfiguration = (model: Named) => TUNED_CONFIGURATION.test(getConfigurationStub(model) ?? '');

/** What sets a configured model apart from the others of its modeling package. */
export const getConfigurationName = (model: Named) => {
    const configuration = getConfigurationStub(model);
    if (!configuration) return i18n.t('Default configuration');
    const tuned = TUNED_CONFIGURATION.exec(configuration);
    return tuned ? i18n.t('Tuned {{id}}', { id: tuned[1] }) : configuration;
};

/** The modeling package and, unless it runs the defaults, the configuration: "EWARS [Tuned 1a2b3c]". */
export const getConfiguredModelName = (model: Named, packageName?: string | null) => {
    const name = packageName || getTemplateName(model);
    return getConfigurationStub(model) ? `${name} [${getConfigurationName(model)}]` : name;
};
