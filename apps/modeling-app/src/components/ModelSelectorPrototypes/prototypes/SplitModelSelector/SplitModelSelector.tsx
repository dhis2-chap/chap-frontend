import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import cn from 'classnames';
import {
    Button,
    InputField,
    IconCheckmark16,
    IconArrowRight16,
    IconDimensionData16,
    IconCalendar16,
    IconWorld16,
} from '@dhis2/ui';
import { ModelSpecRead, Pill } from '@dhis2-chap/ui';
import {
    getModelName,
    getPeriodLabel,
    getReadiness,
    sortByReadiness,
} from '../../shared/modelDisplay';
import styles from './SplitModelSelector.module.css';

type Props = {
    models: ModelSpecRead[];
    selectedModelId?: string;
    onSelect: (model: ModelSpecRead) => void;
};

export const SplitModelSelector = ({ models, selectedModelId, onSelect }: Props) => {
    const [search, setSearch] = useState('');

    const sorted = useMemo(() => sortByReadiness(models), [models]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return sorted;
        }
        return sorted.filter(model =>
            getModelName(model).toLowerCase().includes(query)
            || (model.description ?? '').toLowerCase().includes(query),
        );
    }, [sorted, search]);

    const [focusedId, setFocusedId] = useState<number | undefined>(
        () => sorted.find(m => m.id.toString() === selectedModelId)?.id ?? sorted[0]?.id,
    );

    const focused = useMemo(
        () => filtered.find(model => model.id === focusedId) ?? filtered[0],
        [filtered, focusedId],
    );

    const focusedReadiness = focused ? getReadiness(focused) : undefined;
    const hasAuthorNote = focused?.authorNote && focused.authorNote !== 'No Author note yet';

    return (
        <div className={styles.wrapper}>
            <aside className={styles.rail}>
                <div className={styles.searchBox}>
                    <InputField
                        dense
                        placeholder={i18n.t('Search models')}
                        value={search}
                        onChange={({ value }) => setSearch(value ?? '')}
                    />
                </div>
                <ul className={styles.list}>
                    {filtered.map((model) => {
                        const readiness = getReadiness(model);
                        const isFocused = focused?.id === model.id;
                        const isSelected = selectedModelId === model.id.toString();
                        return (
                            <li key={model.id}>
                                <button
                                    type="button"
                                    className={cn(styles.listItem, { [styles.listItemFocused]: isFocused })}
                                    onClick={() => setFocusedId(model.id)}
                                    data-test={`split-item-${model.id}`}
                                >
                                    <span
                                        className={styles.dot}
                                        style={{ backgroundColor: readiness?.color ?? '#b0b0b0' }}
                                    />
                                    <span className={styles.listName}>{getModelName(model)}</span>
                                    {isSelected && <IconCheckmark16 color="#1565c0" />}
                                </button>
                            </li>
                        );
                    })}
                    {filtered.length === 0 && (
                        <li className={styles.noResults}>{i18n.t('No models found')}</li>
                    )}
                </ul>
            </aside>

            <section className={styles.detail}>
                {focused ? (
                    <>
                        <header className={styles.detailHeader}>
                            <div>
                                <h3 className={styles.detailName}>{getModelName(focused)}</h3>
                                {focusedReadiness && (
                                    <Pill variant={focusedReadiness.pillVariant}>
                                        {focusedReadiness.label}
                                    </Pill>
                                )}
                            </div>
                            <Button
                                primary={selectedModelId !== focused.id.toString()}
                                onClick={() => onSelect(focused)}
                                icon={selectedModelId === focused.id.toString() ? <IconCheckmark16 /> : undefined}
                                dataTest="split-use-model"
                            >
                                {selectedModelId === focused.id.toString()
                                    ? i18n.t('Selected')
                                    : i18n.t('Use this model')}
                            </Button>
                        </header>

                        <p className={styles.detailDescription}>{focused.description}</p>

                        {focusedReadiness && (
                            <p className={styles.readinessNote}>{focusedReadiness.description}</p>
                        )}

                        <dl className={styles.specs}>
                            <div className={styles.spec}>
                                <dt>
                                    <IconCalendar16 color="#6c7787" />
                                    {i18n.t('Period')}
                                </dt>
                                <dd>{getPeriodLabel(focused)}</dd>
                            </div>
                            <div className={styles.spec}>
                                <dt>
                                    <IconArrowRight16 color="#6c7787" />
                                    {i18n.t('Target')}
                                </dt>
                                <dd>{focused.target?.displayName}</dd>
                            </div>
                            <div className={styles.spec}>
                                <dt>
                                    <IconDimensionData16 color="#6c7787" />
                                    {i18n.t('Covariates')}
                                </dt>
                                <dd>
                                    {focused.covariates && focused.covariates.length > 0
                                        ? focused.covariates.map(c => c.displayName).join(', ')
                                        : i18n.t('None')}
                                </dd>
                            </div>
                            <div className={styles.spec}>
                                <dt>
                                    <IconWorld16 color="#6c7787" />
                                    {i18n.t('Author')}
                                </dt>
                                <dd>
                                    {focused.author}
                                    {focused.organization ? ` · ${focused.organization}` : ''}
                                </dd>
                            </div>
                        </dl>

                        {hasAuthorNote && (
                            <div className={styles.authorNote}>
                                <span className={styles.authorNoteLabel}>{i18n.t('Author note')}</span>
                                {focused.authorNote}
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles.detailEmpty}>{i18n.t('Select a model to see details')}</div>
                )}
            </section>
        </div>
    );
};
