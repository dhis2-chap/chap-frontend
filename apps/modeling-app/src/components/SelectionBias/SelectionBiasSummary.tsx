import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import type { BacktestSpecificationRead, MetricInfo } from '@dhis2-chap/ui';
import { getChapErrorMessage } from '../../utils/chapErrors';
import { getConfiguredModelName } from '../../utils/configuredModelName';
import comparisonStyles from '../ModelComparisons/ModelComparisons.module.css';
import { getReferenceModels, referenceName } from '../ModelComparisons/referenceModels';
import { formatComparison } from '../PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import { useSelectionBias } from './useSelectionBias';
import styles from './SelectionBiasSummary.module.css';

type Props = {
    specification: BacktestSpecificationRead;
    /** The metric the models are ranked by. */
    metric?: MetricInfo;
    /** The name the page gives the model of an evaluation, so the summary names it the same way. */
    getModelName?: (backtestId: number) => string | undefined;
};

/**
 * What to expect of the best model of an evaluation on new data. The model with the best score
 * always looks a little better than it is, more so the more models were tried. The numbers are
 * about that one model, the best one; the other models of the evaluation have none.
 * Renders nothing while there is nothing to pick between or Chap Core cannot estimate it.
 */
export const SelectionBiasSummary = ({ specification, metric, getModelName }: Props) => {
    // Evaluating a model again does not add a model to pick between.
    const modelCount = new Set(specification.backtests.map(run => run.configuredModel?.id ?? run.modelId)).size;
    // Chap Core compares with its default metric when the one the models are ranked by cannot be compared with a baseline.
    const bias = useSelectionBias(specification.id, metric?.comparisonOp ? metric.id : undefined, modelCount);
    const title = <h3 className={styles.title}>{i18n.t('Selection bias')}</h3>;

    if (bias.error) {
        return (
            <section className={styles.summary} data-test="selection-bias">
                {title}
                <p className={styles.caption}>
                    {i18n.t('Not estimated{{colon}} {{reason}}', { colon: ':', reason: getChapErrorMessage(bias.error) })}
                </p>
            </section>
        );
    }
    const { data } = bias;
    if (!data) return null;

    const comparedMetric = specification.metrics?.find(item => item.id === data.metricId);
    const format = (value: number) => Number.isFinite(value) ? formatComparison(value, comparedMetric) : '—';
    const baseline = getReferenceModels(specification).find(({ configuredModel }) => [configuredModel.name, configuredModel.modelTemplate.name].includes(data.baselineModel));
    const best = data.candidates.find(candidate => candidate.backtestId === data.selectedBacktestId);
    const otherPicks = data.nDrawsScored - (best?.nDrawsPicked ?? 0);
    const draws = data.nDrawsScored.toLocaleString();
    const [nearest] = data.horizonDistances;
    const farthest = data.horizonDistances[data.horizonDistances.length - 1];

    return (
        <section className={styles.summary} data-test="selection-bias">
            {title}
            <dl className={styles.stats}>
                <div className={styles.stat}>
                    <dt className={styles.label}>{i18n.t('Best model')}</dt>
                    <dd className={styles.value}>{getModelName?.(data.selectedBacktestId) ?? (best ? getConfiguredModelName({ name: best.modelName }) : '—')}</dd>
                </div>
                <div className={styles.stat}>
                    <dt className={styles.label}>{i18n.t('In the evaluation')}</dt>
                    <dd className={styles.value}>{format(data.validationValue)}</dd>
                </div>
                <div className={styles.stat}>
                    <dt className={styles.label}>{i18n.t('Estimated bias')}</dt>
                    <dd className={styles.value}>{format(data.estimatedBias)}</dd>
                </div>
                <div className={styles.stat}>
                    <dt className={styles.label}>{i18n.t('Expected on new data')}</dt>
                    <dd className={cx(styles.value, { [comparisonStyles.better]: data.estimatedValue > 0, [comparisonStyles.worse]: data.estimatedValue < 0 })}>
                        {format(data.estimatedValue)}
                    </dd>
                </div>
            </dl>
            <p className={styles.caption}>
                {[
                    i18n.t('{{metric}} compared with {{baseline}}, where positive is better.', {
                        metric: comparedMetric?.displayName ?? data.metricId,
                        baseline: baseline ? referenceName(baseline) : data.baselineModel,
                    }),
                    otherPicks > 0
                        ? i18n.t('The bias is how much of the lead of the best model is expected to be luck{{colon}} Chap drew the evaluation splits again {{draws}} times, and another model came out best in {{others}} of the draws.', {
                                colon: ':',
                                draws,
                                others: otherPicks.toLocaleString(),
                            })
                        : i18n.t('The bias is how much of the lead of the best model is expected to be luck{{colon}} Chap drew the evaluation splits again {{draws}} times, and the same model came out best every time.', {
                                colon: ':',
                                draws,
                            }),
                    nearest !== farthest && i18n.t('Scored on forecasts {{nearest}} to {{farthest}} periods ahead.', { nearest, farthest }),
                    data.gapSplits > 0 && i18n.t('A split left out of a draw only counts when it forecasts no period that a drawn split also forecasts.'),
                    i18n.t('The estimate is rough.'),
                ].filter(Boolean).join(' ')}
            </p>
        </section>
    );
};
