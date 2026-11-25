import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, IconArrowLeft16, NoticeBox } from '@dhis2/ui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DatasetEvaluationForm } from '../../components/NewEvaluationForm/DatasetEvaluationForm';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { Features, useIsFeatureAvailable } from '../../hooks/useIsFeatureAvailable';
import { useReturnTo } from '../../hooks/useReturnTo';
import styles from './BenchmarksPage.module.css';

export const NewBenchmarkPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const datasetId = searchParams.get('datasetId') ?? undefined;
    const returnTo = useReturnTo();
    const { isAvailable, isLoading } = useIsFeatureAvailable(Features.BENCHMARKS);

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('New benchmark')}
                pageDescription={i18n.t('A benchmark is defined by a saved dataset and backtest parameters. Run models to compare their performance.')}
            />
            <div className={styles.stack}>
                <div>
                    <Button small icon={<IconArrowLeft16 />} onClick={() => navigate(returnTo ?? '/evaluate/benchmarks')}>
                        {returnTo ? i18n.t('Back') : i18n.t('Back to benchmarks')}
                    </Button>
                </div>
                {isLoading ? <div className={styles.loading}><CircularLoader /></div> : isAvailable ? (
                    <DatasetEvaluationForm key={datasetId} initialDatasetId={datasetId} benchmarkContext returnTo={returnTo} />
                ) : (
                    <NoticeBox title={i18n.t('Benchmarks unavailable')}>
                        {i18n.t('This Chap server does not support backtest specifications. Update Chap Core to use benchmarks.')}
                    </NoticeBox>
                )}
            </div>
        </>
    );
};
