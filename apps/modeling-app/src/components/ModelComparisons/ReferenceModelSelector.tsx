import i18n from '@dhis2/d2-i18n';
import { Checkbox, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import type { ReferenceModelResult } from '@dhis2-chap/ui';
import styles from './ModelComparisons.module.css';

type Props = {
    references: ReferenceModelResult[];
    reference?: ReferenceModelResult;
    onSelect: (id: string) => void;
    includeComparisonModels: boolean;
    onIncludeComparisonModels: (include: boolean) => void;
    loading: boolean;
};

export const ReferenceModelSelector = ({ references, reference, onSelect, includeComparisonModels, onIncludeComparisonModels, loading }: Props) => {
    const template = reference?.configuredModel.modelTemplate;
    const status = {
        done: i18n.t('Done'),
        pending: i18n.t('Pending'),
        not_applicable: i18n.t('Not applicable'),
        failed: i18n.t('Failed'),
    };

    return (
        <div className={styles.controls}>
            <SingleSelectField
                dense
                label={i18n.t('Compare with')}
                selected={reference ? String(reference.configuredModel.id) : 'none'}
                onChange={({ selected }) => onSelect(selected)}
                loading={loading}
                helpText={i18n.t('Overall scores only. Positive improvement means better than the reference; zero means equal.')}
            >
                <SingleSelectOption value="none" label={i18n.t('No comparison')} />
                {references.map(item => (
                    <SingleSelectOption
                        key={item.configuredModel.id}
                        value={String(item.configuredModel.id)}
                        label={`${item.configuredModel.modelTemplate.displayName || item.configuredModel.name} (${item.configuredModel.name}) — ${status[item.status]}`}
                    />
                ))}
            </SingleSelectField>
            <Checkbox
                dense
                label={i18n.t('Include comparison models')}
                checked={includeComparisonModels}
                onChange={({ checked }) => onIncludeComparisonModels(checked)}
            />
            {!loading && references.length === 0 && <p className={styles.description}>{i18n.t('No reference models available.')}</p>}
            {reference && (
                <>
                    <p className={styles.description}>
                        {template?.version && (
                            <span>
                                {i18n.t('Version {{version}}', { version: template.version })}
                                {'. '}
                            </span>
                        )}
                        {template?.description}
                    </p>
                    {reference.status !== 'done' && (
                        <NoticeBox title={status[reference.status]} warning={reference.status !== 'pending'}>
                            {reference.message || (reference.status === 'pending'
                                ? i18n.t('This baseline is queued or running. Scores will appear when it finishes.')
                                : i18n.t('Scores are unavailable for this reference model.'))}
                        </NoticeBox>
                    )}
                </>
            )}
        </div>
    );
};
