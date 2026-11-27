import type { ReactNode } from 'react';
import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import { IconCheckmarkCircle16, IconWarning16 } from '@dhis2/ui';
import type { BacktestSpecificationRead, LeaderboardBacktestRead, MetricInfo } from '@dhis2-chap/ui';
import { getComparisonValue, getReferenceModels, getSelectedReference, referenceName } from '../../components/ModelComparisons/referenceModels';
import { ForecastCheck } from './ForecastCheck';
import { getCoverageStatus, type Status } from './guidedStatus';
import styles from './GuidedSetupPage.module.css';

const COVERAGE_METRIC_ID = 'coverage_10_90';
const percent = (value: number) => value.toLocaleString(undefined, { style: 'percent', maximumFractionDigits: 0 });
const signedPercent = (value: number) => value.toLocaleString(undefined, { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' });

const textClass = (status?: Status) => status && { good: styles.good, caution: styles.caution, bad: styles.warn }[status];
const fillClass = (status: Status) => ({ good: styles.goodFill, caution: styles.cautionFill, bad: styles.warnFill }[status]);

/** Labelled ticks under a bar, so its length can be read. Positions run from 0 to 1. */
const Scale = ({ ticks }: { ticks: { position: number; label: string }[] }) => (
    <div className={styles.scale}>
        {ticks.map(({ position, label }) => (
            <span
                key={label}
                className={cx(styles.scaleTick, { [styles.scaleTickStart]: position === 0, [styles.scaleTickEnd]: position === 1 })}
                style={{ insetInlineStart: `${position * 100}%` }}
            >
                {label}
            </span>
        ))}
    </div>
);

type CheckProps = {
    question: string;
    /** Undefined while there is nothing to judge. */
    status?: Status;
    answer: string;
    explanation: string;
    children?: ReactNode;
};

const Check = ({ question, status, answer, explanation, children }: CheckProps) => (
    <div className={styles.check}>
        <p className={styles.muted}>{question}</p>
        <p className={cx(styles.checkAnswer, textClass(status))}>
            {status === 'good' && <IconCheckmarkCircle16 />}
            {(status === 'caution' || status === 'bad') && <IconWarning16 />}
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
 * The questions that say whether a model is worth using, and a look at its forecasts.
 * They are the checks the evaluation guides teach: beat a simple baseline and be right about how sure you are.
 */
export const ModelTrustCheck = ({ specification, run, metric }: Props) => {
    const { baseline, value: improvement } = getBaselineComparison(specification, run, metric);
    const isRatio = metric?.comparisonOp === 'skill_ratio';
    const coverageTarget = specification.metrics?.find(item => item.id === COVERAGE_METRIC_ID)?.target ?? 0.8;
    const coverage = run.aggregateMetrics[COVERAGE_METRIC_ID];
    const coverageStatus = typeof coverage === 'number' && Number.isFinite(coverage) ? getCoverageStatus(coverage, coverageTarget) : undefined;

    return (
        <div className={styles.trust} data-test="guided-trust-check">
            <div className={styles.checks}>
                {baseline && improvement !== undefined ? (
                    <Check
                        question={i18n.t('Does it beat a simple baseline?')}
                        status={improvement > 0 ? 'good' : 'bad'}
                        answer={improvement > 0
                            ? i18n.t('Yes, {{amount}} better than {{baseline}}', { amount: isRatio ? percent(improvement) : improvement.toLocaleString(undefined, { maximumSignificantDigits: 3 }), baseline: referenceName(baseline) })
                            : i18n.t('No, {{amount}} worse than {{baseline}}', { amount: isRatio ? percent(-improvement) : (-improvement).toLocaleString(undefined, { maximumSignificantDigits: 3 }), baseline: referenceName(baseline) })}
                        explanation={i18n.t('Measured with {{metric}}. A baseline is a rule of thumb, such as repeating last year. A model that does not beat it adds little.', { metric: metric?.displayName })}
                    >
                        {isRatio && (
                            <div className={styles.bar} aria-hidden>
                                <div className={styles.barLabels}>
                                    <span>{i18n.t('Worse')}</span>
                                    <span>{i18n.t('Better')}</span>
                                </div>
                                <div className={styles.barTrack}>
                                    <div
                                        className={cx(styles.barFill, improvement > 0 ? styles.goodFill : styles.warnFill)}
                                        style={{
                                            inlineSize: `${Math.min(Math.abs(improvement), 1) * 50}%`,
                                            insetInlineStart: improvement > 0 ? '50%' : `${50 - Math.min(Math.abs(improvement), 1) * 50}%`,
                                        }}
                                    />
                                    <div className={styles.barMarker} style={{ insetInlineStart: '50%' }} />
                                </div>
                                <Scale
                                    ticks={[
                                        { position: 0, label: signedPercent(-1) },
                                        { position: 0.25, label: signedPercent(-0.5) },
                                        { position: 0.5, label: i18n.t('Same') },
                                        { position: 0.75, label: signedPercent(0.5) },
                                        { position: 1, label: signedPercent(1) },
                                    ]}
                                />
                            </div>
                        )}
                    </Check>
                ) : baseline && (
                    // Chap Core evaluates the baselines in the background; older versions have none to compare with.
                    <Check
                        question={i18n.t('Does it beat a simple baseline?')}
                        answer={i18n.t('Not compared yet')}
                        explanation={i18n.t('Chap evaluates the baseline models in the background. Come back in a moment.')}
                    />
                )}
                {coverageStatus && (
                    <Check
                        question={i18n.t('Is it right about how sure it is?')}
                        status={coverageStatus}
                        answer={{
                            good: i18n.t('Yes, {{share}} of the actual values were inside its range', { share: percent(coverage) }),
                            caution: i18n.t('Partly, {{share}} of the actual values were inside its range', { share: percent(coverage) }),
                            bad: i18n.t('No, only {{share}} of the actual values were inside its range', { share: percent(coverage) }),
                        }[coverageStatus]}
                        explanation={i18n.t('A model gives a range it expects {{target}} of the values to fall in. Fewer means it is too sure of itself, so its alerts can mislead.', { target: percent(coverageTarget) })}
                    >
                        <div className={styles.bar} aria-hidden>
                            <div className={styles.barLabels}>
                                <span />
                                <span className={styles.barTargetLabel} style={{ insetInlineStart: `${coverageTarget * 100}%` }}>
                                    {i18n.t('Expected {{target}}', { target: percent(coverageTarget) })}
                                </span>
                            </div>
                            <div className={styles.barTrack}>
                                <div
                                    className={cx(styles.barFill, fillClass(coverageStatus))}
                                    style={{ insetInlineStart: 0, inlineSize: `${Math.min(Math.max(coverage, 0), 1) * 100}%` }}
                                />
                                <div className={styles.barMarker} style={{ insetInlineStart: `${coverageTarget * 100}%` }} />
                            </div>
                            <Scale ticks={[0, 0.25, 0.5, 0.75, 1].map(position => ({ position, label: percent(position) }))} />
                        </div>
                    </Check>
                )}
            </div>
            <ForecastCheck run={run} />
        </div>
    );
};
