import i18n from '@dhis2/d2-i18n';
import type { BacktestSpecificationSummary } from '@dhis2-chap/ui';
import styles from './BenchmarksPage.module.css';

type Parameters = Pick<BacktestSpecificationSummary, 'nPeriods' | 'nSplits' | 'stride' | 'nRetrain' | 'futureWeatherProvider'>;

export const SpecificationParameters = ({ specification: s }: { specification: Parameters }) => (
    <p className={styles.parameters}>
        {i18n.t('Forecast periods {{periods}} · Splits {{splits}} · Stride {{stride}} · Retraining {{retrain}} · Future weather {{weather}}', {
            periods: s.nPeriods ?? '—',
            splits: s.nSplits ?? '—',
            stride: s.stride ?? '—',
            retrain: s.nRetrain ?? '—',
            weather: s.futureWeatherProvider ?? '—',
        })}
    </p>
);
