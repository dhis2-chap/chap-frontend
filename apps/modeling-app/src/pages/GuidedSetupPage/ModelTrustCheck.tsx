import type { ReactNode } from 'react';
import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import { IconCheckmarkCircle16, IconWarning16 } from '@dhis2/ui';
import type { BacktestSpecificationRead, LeaderboardBacktestRead, MetricInfo } from '@dhis2-chap/ui';
import { getComparisonValue, getReferenceModels, getSelectedReference, referenceName } from '../../components/ModelComparisons/referenceModels';
import { TARGET_TOLERANCE } from '../../components/PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import { ForecastCheck } from './ForecastCheck';
import styles from './GuidedSetupPage.module.css';

const COVERAGE_METRIC_ID = 'coverage_10_90';

const percent = (value: number) => value.toLocaleString(undefined, { style: 'percent', maximumFractionDigits: 0 });

type CheckProps = {
    question: string;
    /** Undefined while there is nothing to judge. */
    isGood?: boolean;
    answer: string;
    explanation: string;
    children?: ReactNode;
};

const Check = ({ question, isGood, answer, explanation, children }: CheckProps) => (
    <div className={styles.check}>
        <p className={styles.muted}>{question}</p>
        <p className={cx(styles.checkAnswer, { [styles.good]: isGood === true, [styles.warn]: isGood === false })}>
            {isGood === true && <IconCheckmarkCircle16 />}
            {isGood === false && <IconWarning16 />}
            {answer}
        </p>
        {children}
        <p className={styles.muted}>{explanation}</p>
    </div>
);

type Props = {
    specification: BacktestSpecificationRead;
    run: LeaderboardBacktestRead;
    /** The metric the models are ranked by. */
    metric?: MetricInfo;
};

/** How far a model beats the specification's default baseline on a metric; positive is better, undefined when not compared. */
export const getBaselineComparison = (specification: BacktestSpecificationRead, run: LeaderboardBacktestRead, metric?: MetricInfo) => {
    const baseline = getSelectedReference(getReferenceModels(specification), undefined, specification.defaultBaselineModel);
    return { baseline, value: metric && getComparisonValue(run, baseline, metric.id) };
};

/**
 * Two questions that say whether a model is worth promoting, and a look at its forecasts.
 * They are the checks the evaluation guides teach: beat a simple baseline, and be right about how sure you are.
 */
export const ModelTrustCheck = ({ specification, run, metric }: Props) => {
    const { baseline, value: improvement } = getBaselineComparison(specification, run, metric);
    const isRatio = metric?.comparisonOp === 'skill_ratio';
    const coverageTarget = specification.metrics?.find(item => item.id === COVERAGE_METRIC_ID)?.target ?? 0.8;
    const coverage = run.aggregateMetrics[COVERAGE_METRIC_ID];
    const hasCoverage = typeof coverage === 'number' && Number.isFinite(coverage);

    return (
        <div className={styles.trust} data-test="guided-trust-check">
            <div className={styles.checks}>
                {baseline && improvement !== undefined ? (
                    <Check
                        question={i18n.t('Does it beat a simple baseline?')}
                        isGood={improvement > 0}
                        answer={improvement > 0
                            ? i18n.t('Yes, {{amount}} better than {{baseline}}', { amount: isRatio ? percent(improvement) : improvement.toLocaleString(undefined, { maximumSignificantDigits: 3 }), baseline: referenceName(baseline) })
                            : i18n.t('No, {{amount}} worse than {{baseline}}', { amount: isRatio ? percent(-improvement) : (-improvement).toLocaleString(undefined, { maximumSignificantDigits: 3 }), baseline: referenceName(baseline) })}
                        explanation={i18n.t('Measured with {{metric}}. A baseline is a rule of thumb, such as repeating last year. A model that does not beat it adds little.', { metric: metric?.displayName })}
                    >
                        {isRatio && (
                            <div className={styles.diverging} aria-hidden>
                                <div
                                    className={cx(styles.divergingBar, improvement > 0 ? styles.goodFill : styles.warnFill)}
                                    style={{
                                        inlineSize: `${Math.min(Math.abs(improvement), 1) * 50}%`,
                                        insetInlineStart: improvement > 0 ? '50%' : `${50 - Math.min(Math.abs(improvement), 1) * 50}%`,
                                    }}
                                />
                                <div className={styles.divergingAxis} />
                                <span className={styles.divergingLabelStart}>{i18n.t('Worse')}</span>
                                <span className={styles.divergingLabelEnd}>{i18n.t('Better')}</span>
                            </div>
                        )}
                    </Check>
                ) : (
                    <Check
                        question={i18n.t('Does it beat a simple baseline?')}
                        answer={i18n.t('Not compared yet')}
                        explanation={i18n.t('Chap evaluates the baseline models in the background. Come back in a moment.')}
                    />
                )}
                {hasCoverage && (
                    <Check
                        question={i18n.t('Is it right about how sure it is?')}
                        isGood={coverage >= coverageTarget - TARGET_TOLERANCE}
                        answer={coverage >= coverageTarget - TARGET_TOLERANCE
                            ? i18n.t('Yes, {{share}} of the actual values were inside its range', { share: percent(coverage) })
                            : i18n.t('No, only {{share}} of the actual values were inside its range', { share: percent(coverage) })}
                        explanation={i18n.t('A model gives a range it expects {{target}} of the values to fall in. Far fewer means it is too sure of itself, so its alerts will mislead.', { target: percent(coverageTarget) })}
                    >
                        <div className={styles.meter} aria-hidden>
                            <div
                                className={cx(styles.meterFill, coverage >= coverageTarget - TARGET_TOLERANCE ? styles.goodFill : styles.warnFill)}
                                style={{ inlineSize: `${Math.min(Math.max(coverage, 0), 1) * 100}%` }}
                            />
                            <div className={styles.meterTarget} style={{ insetInlineStart: `${coverageTarget * 100}%` }}>
                                <span>{i18n.t('Expected {{target}}', { target: percent(coverageTarget) })}</span>
                            </div>
                        </div>
                    </Check>
                )}
            </div>
            <ForecastCheck run={run} />
        </div>
    );
};
