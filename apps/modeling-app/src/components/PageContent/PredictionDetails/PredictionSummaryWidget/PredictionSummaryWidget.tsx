import i18n from '@dhis2/d2-i18n';
import { Widget } from '@dhis2-chap/ui';
import styles from './PredictionSummaryWidget.module.css';
import { usePredictionById } from '../hooks/usePredictionById';
import { CircularLoader } from '@dhis2/ui';
import { PeriodView } from './Sections/PeriodView';
import { RegionView } from './Sections/RegionView';
import { ModelView } from './Sections/ModelView';
import { useConfiguredModels } from '@/hooks/useConfiguredModels';

type Props = {
    predictionId: number;
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

export const PredictionSummaryWidget = ({ predictionId }: Props) => {
    const { prediction, isLoading, error } = usePredictionById(predictionId.toString());
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

    if (error || !prediction || !prediction.configuredModel || modelsError) {
        return (
            <WidgetWrapper>
                <div className={styles.errorContainer}>
                    <p>
                        {i18n.t('There was an error loading the prediction summary. Please try again later.')}
                    </p>
                </div>
            </WidgetWrapper>
        );
    }

    return (
        <div className={styles.container}>
            <WidgetWrapper>
                <div className={styles.content}>
                    <div className={styles.row}>
                        <span className={styles.label}>
                            {i18n.t('Name')}
                        </span>
                        <span className={styles.value}>
                            {prediction.name}
                        </span>
                    </div>
                    <ModelView
                        models={models}
                        configuredModelId={prediction.configuredModel.id}
                    />
                    <PeriodView
                        periodType={prediction.dataset.periodType}
                        firstPeriod={prediction.dataset.firstPeriod}
                        lastPeriod={prediction.dataset.lastPeriod}
                        nPeriods={prediction.nPeriods}
                    />
                    <RegionView orgUnits={prediction.dataset.orgUnits} />
                </div>
            </WidgetWrapper>
        </div>
    );
};
