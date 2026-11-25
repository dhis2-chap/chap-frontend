import i18n from '@dhis2/d2-i18n';
import { Button, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import type { ModelSpecRead } from '@dhis2-chap/ui';
import { toDataTestKey } from '../../utils/dataTestKey';
import styles from './GuidedSetupPage.module.css';

const TUNE = 'tune';
const CUSTOM = 'custom';

/** A configured model is named "template:configuration"; without a configuration it runs the defaults. */
export const getTemplateName = (model: ModelSpecRead) => model.name.split(':')[0];

const getConfigurationName = (model: ModelSpecRead) => {
    const [, configuration] = model.name.split(':');
    return configuration || i18n.t('Default hyperparameters');
};

export type ModelChoice = {
    templateName: string;
    displayName: string;
    /** The configurations the model comes with, and any made for it. */
    configurations: ModelSpecRead[];
    /** The configuration to evaluate. */
    selectedId: number;
    /** Configurations already evaluated with the setup in view. */
    evaluatedIds: number[];
    /** For making a configuration of its own; unknown for models without a template. */
    templateId?: number;
};

type Props = {
    choices: ModelChoice[];
    disabled?: boolean;
    onChange: (templateName: string, modelId: number) => void;
    /** Opens the form for hyperparameters of the user's own. */
    onCustomise: (choice: ModelChoice) => void;
    onRemove: (templateName: string) => void;
};

/** Each chosen model with the hyperparameters it is evaluated with. */
export const ModelConfigurations = ({ choices, disabled, onChange, onCustomise, onRemove }: Props) => {
    if (!choices.length) return null;

    return (
        <ul className={styles.list}>
            {choices.map(choice => (
                <li key={choice.templateName} className={styles.listItem}>
                    <div className={styles.modelRow}>
                        <span className={styles.itemName}>{choice.displayName}</span>
                        <div className={styles.row}>
                            <SingleSelectField
                                dense
                                className={styles.configurationSelect}
                                label={i18n.t('Hyperparameters')}
                                disabled={disabled}
                                // A configuration just made shows once the models are read again; an unknown value makes the select throw.
                                selected={choice.configurations.some(model => model.id === choice.selectedId) ? String(choice.selectedId) : undefined}
                                onChange={({ selected }) => {
                                    if (selected === CUSTOM) {
                                        onCustomise(choice);
                                    } else if (selected !== TUNE) {
                                        onChange(choice.templateName, Number(selected));
                                    }
                                }}
                                dataTest={`guided-configuration-${toDataTestKey(choice.templateName)}`}
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
                                {/* Chap Core is getting a way to tune hyperparameters for the data; until then the option is only shown. */}
                                <SingleSelectOption disabled value={TUNE} label={i18n.t('Tune hyperparameters automatically (coming soon)')} />
                                {choice.templateId != null && (
                                    <SingleSelectOption value={CUSTOM} label={i18n.t('Set your own hyperparameters…')} />
                                )}
                            </SingleSelectField>
                            <Button small secondary disabled={disabled} onClick={() => onRemove(choice.templateName)} dataTest={`guided-remove-${toDataTestKey(choice.templateName)}`}>
                                {i18n.t('Remove')}
                            </Button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
};
