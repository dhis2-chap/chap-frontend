import { useEffect, useMemo, useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import cn from 'classnames';
import {
    IconSearch16,
    IconCheckmark16,
    IconCalendar16,
} from '@dhis2/ui';
import { AuthorAssessedStatus, ModelSpecRead } from '@dhis2-chap/ui';
import {
    getModelName,
    getPeriodLabel,
    getReadiness,
    sortByReadiness,
} from '../../shared/modelDisplay';
import styles from './CommandModelSelector.module.css';

type Props = {
    models: ModelSpecRead[];
    selectedModelId?: string;
    onSelect: (model: ModelSpecRead) => void;
};

type ReadinessFilter = 'all' | AuthorAssessedStatus;

const FILTERS: { value: ReadinessFilter; label: string }[] = [
    { value: 'all', label: i18n.t('All') },
    { value: AuthorAssessedStatus.GREEN, label: i18n.t('Production') },
    { value: AuthorAssessedStatus.YELLOW, label: i18n.t('Testing') },
    { value: AuthorAssessedStatus.ORANGE, label: i18n.t('Limited') },
    { value: AuthorAssessedStatus.RED, label: i18n.t('Experimental') },
];

export const CommandModelSelector = ({ models, selectedModelId, onSelect }: Props) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<ReadinessFilter>('all');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const sorted = useMemo(() => sortByReadiness(models), [models]);

    const results = useMemo(() => {
        const query = search.trim().toLowerCase();
        return sorted.filter((model) => {
            const matchesFilter = filter === 'all' || model.authorAssessedStatus === filter;
            const matchesQuery = !query
                || getModelName(model).toLowerCase().includes(query)
                || (model.description ?? '').toLowerCase().includes(query)
                || (model.target?.displayName ?? '').toLowerCase().includes(query);
            return matchesFilter && matchesQuery;
        });
    }, [sorted, search, filter]);

    useEffect(() => {
        setActiveIndex(0);
    }, [search, filter]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const node = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
        node?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(prev => Math.max(prev - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const model = results[activeIndex];
            if (model) {
                onSelect(model);
            }
        }
    };

    return (
        <div className={styles.palette} onKeyDown={handleKeyDown}>
            <div className={styles.searchRow}>
                <IconSearch16 color="#6c7787" />
                <input
                    ref={inputRef}
                    className={styles.input}
                    placeholder={i18n.t('Search for a model by name, target or covariate…')}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    data-test="command-search"
                />
            </div>

            <div className={styles.filters}>
                {FILTERS.map(option => (
                    <button
                        key={option.value}
                        type="button"
                        className={cn(styles.chip, { [styles.chipActive]: filter === option.value })}
                        onClick={() => setFilter(option.value)}
                        data-test={`command-filter-${option.value}`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <ul className={styles.results} ref={listRef}>
                {results.map((model, index) => {
                    const readiness = getReadiness(model);
                    const isSelected = selectedModelId === model.id.toString();
                    const isActive = index === activeIndex;
                    return (
                        <li key={model.id}>
                            <button
                                type="button"
                                data-index={index}
                                className={cn(styles.result, { [styles.resultActive]: isActive })}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => onSelect(model)}
                                data-test={`command-result-${model.id}`}
                            >
                                <span
                                    className={styles.dot}
                                    style={{ backgroundColor: readiness?.color ?? '#b0b0b0' }}
                                    title={readiness?.label}
                                />
                                <span className={styles.resultName}>{getModelName(model)}</span>
                                <span className={styles.resultPeriod}>
                                    <IconCalendar16 color="#9aa3af" />
                                    {getPeriodLabel(model)}
                                </span>
                                {readiness && (
                                    <span className={styles.resultReadiness}>{readiness.label}</span>
                                )}
                                {isSelected && <IconCheckmark16 color="#1565c0" />}
                            </button>
                        </li>
                    );
                })}
                {results.length === 0 && (
                    <li className={styles.noResults}>
                        {i18n.t('No models match “{{query}}”', { query: search })}
                    </li>
                )}
            </ul>

            <div className={styles.footer}>
                <span>
                    <kbd className={styles.kbd}>↑</kbd>
                    <kbd className={styles.kbd}>↓</kbd>
                    {' '}
                    {i18n.t('to navigate')}
                </span>
                <span>
                    <kbd className={styles.kbd}>↵</kbd>
                    {' '}
                    {i18n.t('to select')}
                </span>
                <span className={styles.count}>{i18n.t('{{count}} models', { count: results.length })}</span>
            </div>
        </div>
    );
};
