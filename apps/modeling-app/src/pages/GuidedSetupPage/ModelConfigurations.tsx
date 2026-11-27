import i18n from '@dhis2/d2-i18n';
import { Button, InputField, SingleSelectField, SingleSelectOption, Tag } from '@dhis2/ui';
import type { ModelSpecRead } from '@dhis2-chap/ui';
import { getConfigurationName } from '../../utils/configuredModelName';
import { toDataTestKey } from '../../utils/dataTestKey';
import styles from './GuidedSetupPage.module.css';

/** Chap finds the configuration instead of the user choosing one. */
export const TUNE = 'tune';
const CUSTOM = 'custom';

/** How many configurations tuning tries unless the user says otherwise; the default of Chap Core. */
export const DEFAULT_TRIALS = 20;
const MAX_TRIALS = 100;

/** A configured model of the modeling package, or tuning that makes one. */
export type ConfigurationChoice = number | typeof TUNE;

export type ModelChoice = {
    templateName: string;
    displayName: string;
    /** The configured models the modeling package comes with, and any made for it. */
    configurations: ModelSpecRead[];
    /** What to evaluate. */
    selected: ConfigurationChoice;
    /** Configured models already evaluated with the setup in view. */
    evaluatedIds: number[];
    /** For making a configuration of its own; unknown for models without a template. */
    templateId?: number;
    /** Why the modeling package cannot be tuned; undefined when it can. */
    tuningUnavailable?: string;
    /** The hyperparameters tuning searches over. */
    tunedOptions: string[];
    /** How many configurations tuning tries. */
    trials: number;
    /** Whether tuning also evaluates the default configuration, which the setup has no result for yet. */
    comparesWithDefault: boolean;
};

type Props = {
    choices: ModelChoice[];
    disabled?: boolean;
    onChange: (templateName: string, selected: ConfigurationChoice) => void;
    onTrialsChange: (templateName: string, trials: number) => void;
    /** Opens the form for a configuration of the user's own. */
    onCustomise: (choice: ModelChoice) => void;
    onRemove: (templateName: string) => void;
};

const toTrials = (value?: string) => {
    const trials = Math.round(Number(value));
    return Number.isFinite(trials) ? Math.min(Math.max(trials, 1), MAX_TRIALS) : DEFAULT_TRIALS;
};

/** Each chosen modeling package with the configuration that makes it the configured model to evaluate. */
export const ModelConfigurations = ({ choices, disabled, onChange, onTrialsChange, onCustomise, onRemove }: Props) => {
    if (!choices.length) return null;

    return (
        <ul className={styles.list}>
            {choices.map((choice) => {
                const dataTestKey = toDataTestKey(choice.templateName);
                const isTuning = choice.selected === TUNE;
                return (
                    <li key={choice.templateName} className={styles.listItem}>
                        <div className={styles.modelRow}>
                            <span className={styles.itemLabel}>
                                <span className={styles.itemName}>{choice.displayName}</span>
                                <span className={styles.muted}>{i18n.t('Modeling package')}</span>
                            </span>
                            <div className={styles.row}>
                                <SingleSelectField
                                    dense
                                    className={styles.configurationSelect}
                                    label={i18n.t('Model configuration')}
                                    disabled={disabled}
                                    // A configuration just made shows once the models are read again; an unknown value makes the select throw.
                                    selected={isTuning || choice.configurations.some(model => model.id === choice.selected) ? String(choice.selected) : undefined}
                                    onChange={({ selected }) => {
                                        if (selected === CUSTOM) {
                                            onCustomise(choice);
                                        } else {
                                            onChange(choice.templateName, selected === TUNE ? TUNE : Number(selected));
                                        }
                                    }}
                                    dataTest={`guided-configuration-${dataTestKey}`}
                                >
                                    {choice.configurations.map(model => (
                                        <SingleSelectOption
                                            key={model.id}
                                            value={String(model.id)}
                                            label={choice.evaluatedIds.includes(model.id)
                                                ? i18n.t('{{configuration}} (evaluated)', { configuration: getConfigurationName(model) })
                                                : getConfigurationName(model)}
                                        />
                                    ))}
                                    <SingleSelectOption
                                        disabled={!!choice.tuningUnavailable}
                                        value={TUNE}
                                        label={choice.tuningUnavailable
                                            ? i18n.t('Tune automatically ({{reason}})', { reason: choice.tuningUnavailable })
                                            : i18n.t('Tune automatically (experimental)')}
                                    />
                                    {choice.templateId != null && (
                                        <SingleSelectOption value={CUSTOM} label={i18n.t('Set your own configuration…')} />
                                    )}
                                </SingleSelectField>
                                <Button small secondary disabled={disabled} onClick={() => onRemove(choice.templateName)} dataTest={`guided-remove-${dataTestKey}`}>
                                    {i18n.t('Remove')}
                                </Button>
                            </div>
                        </div>
                        {isTuning && (
                            <div className={styles.tuning} data-test={`guided-tuning-${dataTestKey}`}>
                                <div className={styles.trials}>
                                    <InputField
                                        dense
                                        type="number"
                                        min="1"
                                        max={String(MAX_TRIALS)}
                                        label={i18n.t('Configurations to try')}
                                        value={String(choice.trials)}
                                        disabled={disabled}
                                        onChange={({ value }) => onTrialsChange(choice.templateName, toTrials(value))}
                                        dataTest={`guided-tuning-trials-${dataTestKey}`}
                                    />
                                </div>
                                <div className={styles.tuningText}>
                                    <span><Tag neutral>{i18n.t('Experimental')}</Tag></span>
                                    <p className={styles.muted}>
                                        {choice.tunedOptions.length
                                            ? i18n.t('Chap tries {{trials}} configurations with different values of {{options}}. It scores each on the periods the evaluation trains on and evaluates the best one as a new configured model. Each one is a full training run, so more take longer.', { trials: choice.trials, options: choice.tunedOptions.join(', ') })
                                            : i18n.t('Chap tries {{trials}} configurations. It scores each on the periods the evaluation trains on and evaluates the best one as a new configured model. Each one is a full training run, so more take longer.', { trials: choice.trials })}
                                        {choice.comparesWithDefault && ` ${i18n.t('The default configuration is evaluated as well, so you can see what tuning adds.')}`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};
