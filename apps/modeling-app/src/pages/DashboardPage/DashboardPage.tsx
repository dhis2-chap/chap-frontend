import i18n from '@dhis2/d2-i18n';
import { CircularLoader } from '@dhis2/ui';
import { IconCheckmarkCircle16, IconVisualizationLine16 } from '@dhis2/ui-icons';
import type {
    BacktestRead,
    PredictionSetupRead,
} from '@dhis2-chap/ui';
import { Link } from 'react-router-dom';
import { useBacktests } from '../../hooks/useBacktests';
import { usePredictionSetups } from '../../hooks/usePredictionSetups';
import styles from './DashboardPage.module.css';

const MAX_WIDGET_ITEMS = 5;
const EMPTY_VALUE = '—';

const dateFormatter = new Intl.DateTimeFormat('en-GB');

const getCreatedTime = (created?: string | null) => {
    if (!created) {
        return 0;
    }

    const time = Date.parse(created);
    return Number.isNaN(time) ? 0 : time;
};

const formatDate = (created?: string | null) => (
    created ? dateFormatter.format(new Date(created)) : EMPTY_VALUE
);

const formatLocationCount = (count: number) => i18n.t('{{count}} locations', {
    count,
    defaultValue: '{{count}} location',
    defaultValue_plural: '{{count}} locations',
});

const getEvaluationModelName = (evaluation: BacktestRead) => (
    evaluation.configuredModel?.modelTemplate?.displayName
    || evaluation.configuredModel?.modelTemplate?.name
    || evaluation.configuredModel?.name
    || evaluation.modelId
    || EMPTY_VALUE
);

const getPredictionSetupModelName = (predictionSetup: PredictionSetupRead) => (
    predictionSetup.configuredModelWithDataSource.configuredModel?.modelTemplate?.displayName
    || predictionSetup.configuredModelWithDataSource.configuredModel?.modelTemplate?.name
    || predictionSetup.configuredModelWithDataSource.configuredModel?.name
    || EMPTY_VALUE
);

type WidgetFrameProps = {
    title: string;
    footerLabel: string;
    footerTo: string;
    children: React.ReactNode;
};

const WidgetFrame = ({
    title,
    footerLabel,
    footerTo,
    children,
}: WidgetFrameProps) => (
    <section>
        <h2 className={styles.widgetTitle}>{title}</h2>
        <div className={styles.widget}>
            {children}
            <Link className={styles.footerLink} to={footerTo}>
                {footerLabel}
            </Link>
        </div>
    </section>
);

type EvaluationRunsWidgetProps = {
    evaluations?: BacktestRead[];
    isLoading: boolean;
    error?: Error | null;
};

const EvaluationRunsWidget = ({
    evaluations,
    isLoading,
    error,
}: EvaluationRunsWidgetProps) => {
    const latestEvaluations = [...(evaluations || [])]
        .sort((first, second) => getCreatedTime(second.created) - getCreatedTime(first.created))
        .slice(0, MAX_WIDGET_ITEMS);

    return (
        <WidgetFrame
            title={i18n.t('Latest Evaluation Runs')}
            footerLabel={i18n.t('See all evaluation runs')}
            footerTo="/evaluate"
        >
            {isLoading && (
                <div className={styles.loadingState}>
                    <CircularLoader small />
                </div>
            )}
            {error && !isLoading && (
                <div className={styles.errorState}>
                    {i18n.t('Error loading evaluations')}
                </div>
            )}
            {!isLoading && !error && latestEvaluations.length === 0 && (
                <div className={styles.emptyState}>
                    {i18n.t('No evaluations available')}
                </div>
            )}
            {!isLoading && !error && latestEvaluations.length > 0 && (
                <div className={styles.list}>
                    {latestEvaluations.map(evaluation => (
                        <Link
                            className={styles.listItem}
                            key={evaluation.id}
                            to={`/evaluate/${evaluation.id}`}
                        >
                            <span className={styles.icon}>
                                <IconVisualizationLine16 />
                            </span>
                            <span className={styles.itemContent}>
                                <span className={styles.itemTitle}>
                                    {evaluation.name || i18n.t('Unnamed evaluation')}
                                </span>
                                <span className={styles.itemMeta}>
                                    <span>{formatDate(evaluation.created)}</span>
                                    <span>{formatLocationCount(evaluation.orgUnits?.length ?? 0)}</span>
                                    <span>{getEvaluationModelName(evaluation)}</span>
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </WidgetFrame>
    );
};

type PredictionSetupsWidgetProps = {
    predictionSetups?: PredictionSetupRead[];
    isLoading: boolean;
    error?: Error | null;
};

const PredictionSetupsWidget = ({
    predictionSetups,
    isLoading,
    error,
}: PredictionSetupsWidgetProps) => {
    const latestPredictionSetups = [...(predictionSetups || [])]
        .sort((first, second) => getCreatedTime(second.created) - getCreatedTime(first.created))
        .slice(0, MAX_WIDGET_ITEMS);

    return (
        <WidgetFrame
            title={i18n.t('Prediction Setups')}
            footerLabel={i18n.t('See all prediction setups')}
            footerTo="/predictions"
        >
            {isLoading && (
                <div className={styles.loadingState}>
                    <CircularLoader small />
                </div>
            )}
            {error && !isLoading && (
                <div className={styles.errorState}>
                    {i18n.t('Error loading prediction setups')}
                </div>
            )}
            {!isLoading && !error && latestPredictionSetups.length === 0 && (
                <div className={styles.emptyState}>
                    {i18n.t('No prediction setups yet')}
                </div>
            )}
            {!isLoading && !error && latestPredictionSetups.length > 0 && (
                <div className={styles.list}>
                    {latestPredictionSetups.map(predictionSetup => (
                        <Link
                            className={styles.listItem}
                            key={predictionSetup.id}
                            to={`/predictions/${predictionSetup.id}`}
                        >
                            <span className={`${styles.icon} ${styles.successIcon}`}>
                                <IconCheckmarkCircle16 />
                            </span>
                            <span className={styles.itemContent}>
                                <span className={styles.itemTitle}>
                                    {predictionSetup.name}
                                </span>
                                <span className={styles.itemSubtitle}>
                                    {getPredictionSetupModelName(predictionSetup)}
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </WidgetFrame>
    );
};

export const DashboardPage: React.FC = () => {
    const {
        backtests,
        error: evaluationsError,
        isLoading: evaluationsLoading,
    } = useBacktests();
    const {
        predictionSetups,
        error: predictionSetupsError,
        isLoading: predictionSetupsLoading,
    } = usePredictionSetups();

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.screenReaderOnly}>{i18n.t('Dashboard')}</h1>
            <div className={styles.widgetGrid}>
                <EvaluationRunsWidget
                    evaluations={backtests}
                    isLoading={evaluationsLoading}
                    error={evaluationsError}
                />
                <PredictionSetupsWidget
                    predictionSetups={predictionSetups}
                    isLoading={predictionSetupsLoading}
                    error={predictionSetupsError}
                />
            </div>
        </div>
    );
};
