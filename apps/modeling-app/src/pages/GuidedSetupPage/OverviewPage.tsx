import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, Tag } from '@dhis2/ui';
import { Card } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { formatPeriodRange } from '../BenchmarksPage/SpecificationParameters';
import { getRunModelName, type GuidedProgress } from './useGuidedProgress';
import type { GuidedSetupSummary } from './guidedStatus';
import { useGuidedOverview } from './useGuidedOverview';
import styles from './GuidedSetupPage.module.css';

const StageTag = ({ setup }: { setup: GuidedSetupSummary }) => {
    switch (setup.stage) {
        case 'inUse':
            return <Tag positive>{i18n.t('Predicting')}</Tag>;
        case 'readyToChoose':
            return <Tag neutral>{i18n.t('Ready to choose a model')}</Tag>;
        case 'evaluating':
            return <Tag>{i18n.t('Evaluating')}</Tag>;
        default:
            return <Tag>{i18n.t('Not evaluated')}</Tag>;
    }
};

const getStageSummary = ({ stage, runs, chosenRuns, runningCount }: GuidedSetupSummary) => {
    switch (stage) {
        case 'inUse':
            return i18n.t('Predictions from {{models}}', { models: chosenRuns.map(getRunModelName).join(', ') });
        case 'readyToChoose':
            return i18n.t('{{count}} models evaluated, none in use', {
                count: runs.length,
                defaultValue: '{{count}} model evaluated, none in use',
                defaultValue_plural: '{{count}} models evaluated, none in use',
            });
        case 'evaluating':
            return i18n.t('{{count}} models running', { count: runningCount, defaultValue: '{{count}} model running', defaultValue_plural: '{{count}} models running' });
        default:
            return i18n.t('No models evaluated yet');
    }
};

/** Every setup that has been started, what stage it is at, and a way back into it. */
export const OverviewPage = ({ progress }: { progress: GuidedProgress }) => {
    const navigate = useNavigate();
    const { setups, isLoading, error } = useGuidedOverview(progress.importedDatasets);

    return (
        <div className={styles.page}>
            <Card className={styles.card}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3 className={styles.title}>{i18n.t('Your setups')}</h3>
                        <p className={styles.description}>
                            {i18n.t('Each set of imported data is a setup. Continue where it stopped, or start a new one with new data.')}
                        </p>
                    </div>
                    <span className={styles.nowrap}>
                        <Button primary onClick={() => navigate('/guided/data?import=true')} dataTest="guided-new-setup">
                            {i18n.t('Start a new setup')}
                        </Button>
                    </span>
                </div>
                {error ? (
                    <ChapErrorNotice error={error} title={i18n.t('Could not load your setups')} />
                ) : isLoading ? <CircularLoader small /> : (
                    <ul className={styles.list}>
                        {setups.map(setup => (
                            <li key={setup.dataset.id} className={styles.listItem} data-test={`guided-setup-${setup.dataset.id}`}>
                                <div className={styles.modelRow}>
                                    <span className={styles.itemLabel}>
                                        <span className={styles.itemName}>{setup.dataset.name}</span>
                                        <span className={styles.muted}>
                                            {[
                                                formatPeriodRange(setup.dataset),
                                                i18n.t('{{count}} locations', { count: setup.dataset.orgUnits?.length ?? 0, defaultValue: '{{count}} location', defaultValue_plural: '{{count}} locations' }),
                                                getStageSummary(setup),
                                            ].join(' · ')}
                                        </span>
                                    </span>
                                    <div className={styles.row}>
                                        <StageTag setup={setup} />
                                        <Button small onClick={() => navigate(progress.pathTo(setup.step, setup.dataset.id))} dataTest={`guided-continue-${setup.dataset.id}`}>
                                            {i18n.t('Continue')}
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
};
