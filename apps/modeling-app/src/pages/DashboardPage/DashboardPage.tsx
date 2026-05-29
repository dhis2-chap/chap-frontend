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
import { sortByCreatedDesc } from '../../utils/sortByCreated';
import styles from './DashboardPage.module.css';

const MAX_WIDGET_ITEMS = 5;
const EMPTY_VALUE = '-';

const dateFormatter = new Intl.DateTimeFormat('en-GB');

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
    predictionSetup.configuredModel?.modelTemplate?.displayName
    || predictionSetup.configuredModel?.modelTemplate?.name
    || predictionSetup.configuredModel?.name
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

type RecentItemsWidgetProps<T> = {
    title: string;
    footerLabel: string;
    footerTo: string;
    items?: T[];
    isLoading: boolean;
    error?: Error | null;
    emptyMessage: string;
    errorMessage: string;
    getKey: (item: T) => string | number;
    getLinkTo: (item: T) => string;
    renderIcon: (item: T) => React.ReactNode;
    renderContent: (item: T) => React.ReactNode;
};

const RecentItemsWidget = <T extends { created?: string | null }>({
    title,
    footerLabel,
    footerTo,
    items,
    isLoading,
    error,
    emptyMessage,
    errorMessage,
    getKey,
    getLinkTo,
    renderIcon,
    renderContent,
}: RecentItemsWidgetProps<T>) => {
    const latestItems = sortByCreatedDesc(items ?? []).slice(0, MAX_WIDGET_ITEMS);

    return (
        <WidgetFrame
            title={title}
            footerLabel={footerLabel}
            footerTo={footerTo}
        >
            {isLoading && (
                <div className={styles.loadingState}>
                    <CircularLoader small />
                </div>
            )}
            {error && !isLoading && (
                <div className={styles.errorState}>
                    {errorMessage}
                </div>
            )}
            {!isLoading && !error && latestItems.length === 0 && (
                <div className={styles.emptyState}>
                    {emptyMessage}
                </div>
            )}
            {!isLoading && !error && latestItems.length > 0 && (
                <div className={styles.list}>
                    {latestItems.map(item => (
                        <Link
                            className={styles.listItem}
                            key={getKey(item)}
                            to={getLinkTo(item)}
                        >
                            {renderIcon(item)}
                            <span className={styles.itemContent}>
                                {renderContent(item)}
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
                <RecentItemsWidget
                    title={i18n.t('Latest Evaluation Runs')}
                    footerLabel={i18n.t('See all evaluation runs')}
                    footerTo="/evaluate"
                    items={backtests}
                    isLoading={evaluationsLoading}
                    error={evaluationsError}
                    emptyMessage={i18n.t('No evaluations available')}
                    errorMessage={i18n.t('Error loading evaluations')}
                    getKey={evaluation => evaluation.id}
                    getLinkTo={evaluation => `/evaluate/${evaluation.id}`}
                    renderIcon={() => (
                        <span className={styles.icon}>
                            <IconVisualizationLine16 />
                        </span>
                    )}
                    renderContent={evaluation => (
                        <>
                            <span className={styles.itemTitle}>
                                {evaluation.name || i18n.t('Unnamed evaluation')}
                            </span>
                            <span className={styles.itemMeta}>
                                <span>{formatDate(evaluation.created)}</span>
                                <span>{formatLocationCount(evaluation.orgUnits?.length ?? 0)}</span>
                                <span>{getEvaluationModelName(evaluation)}</span>
                            </span>
                        </>
                    )}
                />
                <RecentItemsWidget
                    title={i18n.t('Prediction Setups')}
                    footerLabel={i18n.t('See all prediction setups')}
                    footerTo="/predictions"
                    items={predictionSetups}
                    isLoading={predictionSetupsLoading}
                    error={predictionSetupsError}
                    emptyMessage={i18n.t('No prediction setups yet')}
                    errorMessage={i18n.t('Error loading prediction setups')}
                    getKey={predictionSetup => predictionSetup.id}
                    getLinkTo={predictionSetup => `/predictions/${predictionSetup.id}`}
                    renderIcon={() => (
                        <span className={`${styles.icon} ${styles.successIcon}`}>
                            <IconCheckmarkCircle16 />
                        </span>
                    )}
                    renderContent={predictionSetup => (
                        <>
                            <span className={styles.itemTitle}>
                                {predictionSetup.name}
                            </span>
                            <span className={styles.itemSubtitle}>
                                {getPredictionSetupModelName(predictionSetup)}
                            </span>
                        </>
                    )}
                />
            </div>
        </div>
    );
};
