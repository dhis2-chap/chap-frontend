import { describe, expect, it } from 'vitest';
import { getConfigurationName, getConfiguredModelName, getTemplateName, isTunedConfiguration } from './configuredModelName';

describe('configured model names', () => {
    it('reads the modeling package from the name', () => {
        expect(getTemplateName({ name: 'ewars_template:Higher precision' })).toBe('ewars_template');
        expect(getTemplateName({ name: 'ewars_template' })).toBe('ewars_template');
    });

    it('names the default configuration, a named one and a tuned one', () => {
        expect(getConfigurationName({ name: 'ewars_template' })).toBe('Default configuration');
        expect(getConfigurationName({ name: 'ewars_template:Higher precision' })).toBe('Higher precision');
        expect(getConfigurationName({ name: 'ewars_template:hpo_1a2b3c4d5e6f' })).toBe('Tuned 1a2b3c');
    });

    it('only takes the names Chap Core gives tuned configurations as tuned', () => {
        expect(isTunedConfiguration({ name: 'ewars_template:hpo_1a2b3c4d5e6f' })).toBe(true);
        expect(isTunedConfiguration({ name: 'ewars_template:hpo_search' })).toBe(false);
        expect(isTunedConfiguration({ name: 'ewars_template' })).toBe(false);
    });

    it('tells the configured models of one modeling package apart', () => {
        expect(getConfiguredModelName({ name: 'ewars_template' }, 'EWARS')).toBe('EWARS');
        expect(getConfiguredModelName({ name: 'ewars_template:hpo_1a2b3c4d5e6f' }, 'EWARS')).toBe('EWARS [Tuned 1a2b3c]');
        expect(getConfiguredModelName({ name: 'ewars_template:Higher precision' })).toBe('ewars_template [Higher precision]');
    });
});
