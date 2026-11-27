import { Fragment } from 'react';
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

/** The models listed with how often they came out best. */
const MAX_ROWS = 4;
const percent = (value: number) => value.toLocaleString(undefined, { style: 'percent', maximumFractionDigits: 0 });
/** A share of the draws, never rounded to 0% or 100% when it is neither. */
const formatShare = (share: number) => share > 0 && share < 0.005 ? `<${percent(0.01)}` : share < 1 && share > 0.995 ? `>${percent(0.99)}` : percent(share);

type Props = {
    specification: BacktestSpecificationRead;
    /** The metric the models are ranked by. */
    metric?: MetricInfo;
    /** The name the page gives the model of an evaluation, so the summary names it the same way. */
    getModelName?: (backtestId: number) => string | undefined;
};

/**
 * Whether the lead of the best model in an evaluation is more than luck, and what to expect of it
 * on new data. The model with the best score always looks a little better than it is, more so the
 * more models were tried. Chap Core redraws the splits of the evaluation and picks the best model
 * each time; the numbers are about that one model, the best one.
 * Renders nothing while there is nothing to pick between or no answer yet.
 */
export const SelectionBiasSummary = ({ specification, metric, getModelName }: Props) => {
    // Evaluating a model again does not add a model to pick between.
    const modelCount = new Set(specification.backtests.map(run => run.configuredModel?.id ?? run.modelId)).size;
    // Chap Core compares with its default metric when the one the models are ranked by cannot be compared with a baseline.
    const bias = useSelectionBias(specification.id, metric?.comparisonOp ? metric.id : undefined, modelCount);
    const title = <h3 className={styles.title}>{i18n.t('Is the best model ahead of the others by more than luck?')}</h3>;

    if (bias.error) {
        return (
            <section className={styles.summary} data-test="selection-bias">
                {title}
                <p className={styles.caption}>
                    {i18n.t('Not checked{{colon}} {{reason}}', { colon: ':', reason: getChapErrorMessage(bias.error), interpolation: { escapeValue: false } })}
                </p>
            </section>
        );
    }
    const { data } = bias;
    if (!data || !(data.nDrawsScored > 0)) return null;

    const nameOf = (backtestId: number, modelName: string) => getModelName?.(backtestId) ?? getConfiguredModelName({ name: modelName });
    const rows = data.candidates
        .map(candidate => ({ candidate, share: candidate.nDrawsPicked / data.nDrawsScored, isBest: candidate.backtestId === data.selectedBacktestId }))
        // Stable, so models that come out best equally often keep Chap Core's order, best score first.
        .sort((a, b) => b.share - a.share);
    const best = rows.find(row => row.isBest);
    if (!best) return null;
    const shown = rows.indexOf(best) < MAX_ROWS ? rows.slice(0, MAX_ROWS) : [...rows.slice(0, MAX_ROWS - 1), best];
    // The model that came out best most often, when that is another one than the best score.
    const leader = rows[0].candidate.nDrawsPicked > best.candidate.nDrawsPicked ? rows[0] : undefined;
    // Chap Core: a model that comes out best in every draw has no selection bias.
    const isEveryDraw = best.candidate.nDrawsPicked === data.nDrawsScored;
    // React escapes the text, so the names and Chap Core's messages interpolated below are not escaped twice.
    const model = nameOf(best.candidate.backtestId, best.candidate.modelName);
    const draws = data.nDrawsScored.toLocaleString();
    const picked = best.candidate.nDrawsPicked.toLocaleString();

    const comparedMetric = specification.metrics?.find(item => item.id === data.metricId);
    const format = (value: number) => Number.isFinite(value) ? formatComparison(value, comparedMetric) : '—';
    const reference = getReferenceModels(specification).find(({ configuredModel }) => [configuredModel.name, configuredModel.modelTemplate.name].includes(data.baselineModel));
    const baseline = reference ? referenceName(reference) : data.baselineModel;
    const [nearest] = data.horizonDistances;
    const farthest = data.horizonDistances[data.horizonDistances.length - 1];

    return (
        <section className={styles.summary} data-test="selection-bias">
            {title}
            {data.isFirstHorizonOnly && (
                <p className={styles.caption}>{i18n.t('Forecasts one period ahead{{colon}}', { colon: ':' })}</p>
            )}
            <p className={cx(styles.answer, { [styles.clear]: isEveryDraw, [styles.unclear]: leader })} data-test="selection-bias-answer">
                {isEveryDraw
                    ? i18n.t('{{model}} came out best in every one of {{draws}} redraws of the evaluation, so its lead is not luck.', { model, draws, interpolation: { escapeValue: false } })
                    : leader
                        ? i18n.t('{{model}} has the best score, but {{other}} came out best more often in redraws of the evaluation ({{otherPicked}} against {{picked}} of {{draws}}), so the lead of {{model}} may be luck.', {
                                model,
                                other: nameOf(leader.candidate.backtestId, leader.candidate.modelName),
                                otherPicked: leader.candidate.nDrawsPicked.toLocaleString(),
                                picked,
                                draws,
                                interpolation: { escapeValue: false },
                            })
                        : i18n.t('{{model}} came out best in {{picked}} of {{draws}} redraws of the evaluation, so part of its lead may be luck.', { model, picked, draws, interpolation: { escapeValue: false } })}
            </p>
            <div className={styles.draws}>
                {shown.map(({ candidate, share, isBest }) => (
                    <Fragment key={candidate.backtestId}>
                        <span className={cx({ [styles.strong]: isBest })}>{nameOf(candidate.backtestId, candidate.modelName)}</span>
                        <div className={styles.track} aria-hidden>
                            <div className={cx(styles.fill, { [styles.bestFill]: isBest })} style={{ inlineSize: `${share * 100}%` }} />
                        </div>
                        <span className={cx(styles.share, { [styles.strong]: isBest })}>{formatShare(share)}</span>
                    </Fragment>
                ))}
            </div>
            <dl className={styles.stats}>
                <div className={styles.stat}>
                    <dt className={styles.label}>{i18n.t('Compared with {{baseline}} in the evaluation', { baseline, interpolation: { escapeValue: false } })}</dt>
                    <dd className={styles.value}>{format(data.validationValue)}</dd>
                </div>
                <div className={styles.stat}>
                    <dt className={styles.label}>{i18n.t('Expected on new data')}</dt>
                    <dd className={cx(styles.value, { [comparisonStyles.better]: data.estimatedValue > 0, [comparisonStyles.worse]: data.estimatedValue < 0 })}>
                        {format(data.estimatedValue)}
                    </dd>
                </div>
            </dl>
            {data.estimatedValue < 0 && (
                <p className={cx(styles.answer, comparisonStyles.worse)}>
                    {i18n.t('Even the best model is expected to do worse than {{baseline}} on new data.', { baseline, interpolation: { escapeValue: false } })}
                </p>
            )}
            <p className={styles.caption}>
                {[
                    i18n.t('Chap picked the best model by {{metric}} again on {{draws}} random redraws of the evaluation splits, without running any model again. The best of several models always looks a little better than it is; the value expected on new data takes out the part that is likely luck. Positive is better than {{baseline}}.', {
                        metric: comparedMetric?.displayName ?? data.metricId,
                        draws,
                        baseline,
                        interpolation: { escapeValue: false },
                    }),
                    data.isFirstHorizonOnly
                        ? i18n.t('This evaluation has too few splits to check every period ahead, so only forecasts one period ahead were checked. The numbers can differ from the scores above, and so can the best model.')
                        : nearest !== farthest && i18n.t('Forecasts {{nearest}} to {{farthest}} periods ahead were checked.', { nearest, farthest }),
                    i18n.t('The estimate is rough.'),
                ].filter(Boolean).join(' ')}
            </p>
        </section>
    );
};
