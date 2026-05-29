import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import cn from 'classnames';
import {
    Button,
    IconStarFilled24,
    IconCheckmark16,
    IconChevronDown16,
    IconChevronUp16,
    IconArrowRight16,
    IconCalendar16,
} from '@dhis2/ui';
import { AuthorAssessedStatus, ModelSpecRead, Pill } from '@dhis2-chap/ui';
import {
    getModelName,
    getPeriodLabel,
    getReadiness,
    sortByReadiness,
} from '../../shared/modelDisplay';
import styles from './GuidedModelSelector.module.css';

type Props = {
    models: ModelSpecRead[];
    selectedModelId?: string;
    onSelect: (model: ModelSpecRead) => void;
};

export const GuidedModelSelector = ({ models, selectedModelId, onSelect }: Props) => {
    const [showAll, setShowAll] = useState(false);

    const sorted = useMemo(() => sortByReadiness(models), [models]);

    const recommended = useMemo(
        () => sorted.find(model => model.authorAssessedStatus === AuthorAssessedStatus.GREEN) ?? sorted[0],
        [sorted],
    );

    const rest = useMemo(
        () => sorted.filter(model => model.id !== recommended?.id),
        [sorted, recommended],
    );

    if (!recommended) {
        return <div className={styles.empty}>{i18n.t('No models available')}</div>;
    }

    const recommendedReadiness = getReadiness(recommended);
    const isRecommendedSelected = selectedModelId === recommended.id.toString();

    return (
        <div className={styles.wrapper}>
            <div className={cn(styles.hero, { [styles.heroSelected]: isRecommendedSelected })}>
                <div className={styles.heroBadge}>
                    <IconStarFilled24 color="#1565c0" />
                    <span>{i18n.t('Recommended to start with')}</span>
                </div>

                <div className={styles.heroBody}>
                    <div className={styles.heroInfo}>
                        <h3 className={styles.heroName}>{getModelName(recommended)}</h3>
                        <p className={styles.heroDescription}>{recommended.description}</p>

                        <div className={styles.heroMeta}>
                            <span className={styles.metaItem}>
                                <IconCalendar16 color="#6c7787" />
                                {getPeriodLabel(recommended)}
                            </span>
                            <span className={styles.metaItem}>
                                <IconArrowRight16 color="#6c7787" />
                                {recommended.target?.displayName}
                            </span>
                            {recommendedReadiness && (
                                <Pill variant={recommendedReadiness.pillVariant}>
                                    {recommendedReadiness.label}
                                </Pill>
                            )}
                        </div>
                    </div>

                    <Button
                        primary={!isRecommendedSelected}
                        onClick={() => onSelect(recommended)}
                        icon={isRecommendedSelected ? <IconCheckmark16 /> : undefined}
                        dataTest="guided-select-recommended"
                    >
                        {isRecommendedSelected ? i18n.t('Selected') : i18n.t('Use this model')}
                    </Button>
                </div>
            </div>

            <button
                type="button"
                className={styles.toggle}
                onClick={() => setShowAll(prev => !prev)}
                data-test="guided-toggle-all"
            >
                {showAll
                    ? i18n.t('Hide other models')
                    : i18n.t('Browse all {{count}} models', { count: models.length })}
                {showAll ? <IconChevronUp16 /> : <IconChevronDown16 />}
            </button>

            {showAll && (
                <ul className={styles.list}>
                    {rest.map((model) => {
                        const readiness = getReadiness(model);
                        const isSelected = selectedModelId === model.id.toString();
                        return (
                            <li key={model.id}>
                                <button
                                    type="button"
                                    className={cn(styles.row, { [styles.rowSelected]: isSelected })}
                                    onClick={() => onSelect(model)}
                                    data-test={`guided-row-${model.id}`}
                                >
                                    <span
                                        className={styles.dot}
                                        style={{ backgroundColor: readiness?.color ?? '#b0b0b0' }}
                                    />
                                    <span className={styles.rowMain}>
                                        <span className={styles.rowName}>{getModelName(model)}</span>
                                        <span className={styles.rowSub}>
                                            {getPeriodLabel(model)}
                                            {' '}
                                            ·
                                            {readiness?.label}
                                        </span>
                                    </span>
                                    {isSelected
                                        ? <IconCheckmark16 color="#1565c0" />
                                        : <IconArrowRight16 color="#b0b0b0" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
