import i18n from '@dhis2/d2-i18n';
import { Widget } from '@dhis2-chap/ui';
import styles from './EvaluationSummaryWidget.module.css';
import { useBacktestById } from '@/hooks/useBacktestById';
import { CircularLoader } from '@dhis2/ui';
import { PeriodView } from './Sections/PeriodView';
import { RegionView } from './Sections/RegionView';
import { ModelView } from './Sections/ModelView';
import { ModelVersionWarningView } from './Sections/ModelVersionWarningView';
import { useConfiguredModels } from '@/hooks/useConfiguredModels';

type Props = {
    evaluationId: number;
};

const WidgetWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <Widget
            header={i18n.t('Summary')}
            noncollapsible
        >
            {children}
        </Widget>
    );
};

export const EvaluationSummaryWidget = ({ evaluationId }: Props) => {
    const { backtest, isLoading, error } = useBacktestById(evaluationId);
    const { models, isLoading: isModelsLoading, error: modelsError } = useConfiguredModels();

    if (isLoading || isModelsLoading) {
        return (
            <WidgetWrapper>
                <div className={styles.loadingContainer}>
                    <CircularLoader />
                </div>
            </WidgetWrapper>
        );
    }

    if (error || !backtest || modelsError) {
        return (
            <WidgetWrapper>
                <div className={styles.errorContainer}>
                    <p>
                        {i18n.t('There was an error loading the evaluation summary. Please try again later.')}
                    </p>
                </div>
            </WidgetWrapper>
        );
    }

    return (
        <div className={styles.container}>
            <ModelVersionWarningView
                modelTemplateVersion={backtest.modelTemplateVersion}
                configuredModelTemplateVersion={backtest.configuredModel.modelTemplate.version}
            />
            <WidgetWrapper>
                <div className={styles.content}>
                    <div className={styles.row}>
                        <span className={styles.label}>
                            {i18n.t('Name')}
                        </span>
                        <span className={styles.value}>
                            {backtest.name}
                        </span>
                    </div>
                    <ModelView
                        models={models}
                        configuredModelId={backtest.configuredModel.id}
                    />
                    <PeriodView
                        periodType={backtest.dataset.periodType}
                        firstPeriod={backtest.dataset.firstPeriod}
                        lastPeriod={backtest.dataset.lastPeriod}
                    />
                    <RegionView orgUnits={backtest.dataset.orgUnits} />
                </div>
            </WidgetWrapper>
        </div>
    );
};
