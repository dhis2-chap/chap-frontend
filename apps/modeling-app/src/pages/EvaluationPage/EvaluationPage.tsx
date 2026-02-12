import {
    CircularLoader,
    NoticeBox,
} from '@dhis2/ui';
import { Card } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './EvaluationPage.module.css';
import { useBacktests } from '../../hooks/useBacktests';
import { BacktestsTable } from '../../components/BacktestsTable';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { useModels } from '../../hooks/useModels';

export const EvaluationPage: React.FC = () => {
    const { backtests, error: backtestsError, isLoading: backtestsLoading } = useBacktests();
    const { models, error: modelsError, isLoading: modelsLoading } = useModels({ includeArchived: true });

    if (backtestsLoading || modelsLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (backtestsError || modelsError) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox error title={i18n.t('Error loading evaluations')}>
                    {backtestsError?.message || modelsError?.message || i18n.t('An unknown error occurred')}
                </NoticeBox>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Evaluations')}
                pageDescription={i18n.t('Evaluates the accuracy of a predictive model using historical data. Compares actual outcomes with predicted values to assess model performance.')}
            />
            <Card className={styles.container}>
                <BacktestsTable
                    backtests={backtests || []}
                    models={models || []}
                />
            </Card>
        </>
    );
};
