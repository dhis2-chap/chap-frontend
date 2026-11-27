import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import { IconCheckmark16 } from '@dhis2/ui';
import { Link } from 'react-router-dom';
import { GUIDED_STEPS, getRunModelName, type GuidedProgress, type GuidedStep } from './useGuidedProgress';
import styles from './GuidedSetupPage.module.css';

type Props = {
    progress: GuidedProgress;
    active: GuidedStep;
};

export const Stepper = ({ progress, active }: Props) => {
    const { dataset, runs, runningJobs, chosenRuns, current, pathTo } = progress;
    const steps: { id: GuidedStep; title: string; summary?: string; isDone: boolean }[] = [
        { id: 'data', title: i18n.t('Data'), summary: dataset?.name, isDone: !!dataset },
        {
            id: 'evaluate',
            title: i18n.t('Evaluate'),
            summary: [
                runs.length > 0 && i18n.t('{{count}} models evaluated', { count: runs.length, defaultValue: '{{count}} model evaluated', defaultValue_plural: '{{count}} models evaluated' }),
                runningJobs.length > 0 && i18n.t('{{count}} models running', { count: runningJobs.length, defaultValue: '{{count}} model running', defaultValue_plural: '{{count}} models running' }),
            ].filter(Boolean).join(' · '),
            isDone: runs.length > 0,
        },
        {
            id: 'model',
            title: i18n.t('Choose model'),
            summary: chosenRuns.map(getRunModelName).join(', '),
            isDone: chosenRuns.length > 0,
        },
        { id: 'predict', title: i18n.t('Predict'), isDone: false },
    ];

    return (
        <nav aria-label={i18n.t('Setup steps')}>
            <ol className={styles.stepper}>
                {steps.map(({ id, title, summary, isDone }, index) => {
                    const isActive = id === active;
                    const content = (
                        <>
                            <span className={cx(styles.marker, { [styles.done]: isDone, [styles.current]: isActive && !isDone })} aria-hidden>
                                {isDone ? <IconCheckmark16 /> : index + 1}
                            </span>
                            <span className={styles.stepperText}>
                                <span className={styles.stepperTitle}>{title}</span>
                                {summary && <span className={styles.stepperSummary} title={summary}>{summary}</span>}
                            </span>
                        </>
                    );
                    return (
                        <li
                            key={id}
                            className={cx(styles.stepperItem, { [styles.active]: isActive })}
                            aria-current={isActive ? 'step' : undefined}
                            data-test={`guided-step-${id}`}
                        >
                            {index <= GUIDED_STEPS.indexOf(current)
                                ? <Link className={styles.stepperLink} to={pathTo(id)}>{content}</Link>
                                : <span className={cx(styles.stepperLink, styles.unreached)}>{content}</span>}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
