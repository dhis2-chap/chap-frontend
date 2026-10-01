import i18n from '@dhis2/d2-i18n';
import { Tag, getPeriodNameFromId } from '@dhis2-chap/ui';
import type { BacktestSpecificationSummary, DataSetMeta } from '@dhis2-chap/ui';
import styles from './BenchmarksPage.module.css';

type Parameters = Pick<BacktestSpecificationSummary, 'nPeriods' | 'nSplits' | 'stride' | 'nRetrain' | 'futureWeatherProvider'>;

const getParameters = (s: Parameters) => [
    { label: i18n.t('Forecast periods'), value: s.nPeriods },
    { label: i18n.t('Splits'), value: s.nSplits },
    { label: i18n.t('Stride'), value: s.stride },
    { label: i18n.t('Retraining'), value: s.nRetrain },
    { label: i18n.t('Future weather'), value: s.futureWeatherProvider },
];

export const formatPeriodRange = (dataset: DataSetMeta) => (
    dataset.firstPeriod && dataset.lastPeriod
        ? `${getPeriodNameFromId(dataset.firstPeriod, 'short')} – ${getPeriodNameFromId(dataset.lastPeriod, 'short')}`
        : '—'
);

export const SpecificationParameters = ({ specification }: { specification: Parameters }) => (
    <div className={styles.parameterTags}>
        {getParameters(specification).map(({ label, value }) => (
            <Tag key={label}>
                <span className={styles.parameterLabel}>{label}</span>
                {value ?? '—'}
            </Tag>
        ))}
    </div>
);

type SummaryProps = {
    specification: Parameters & { dataset: DataSetMeta };
    orgUnitCount: number;
};

export const SpecificationSummary = ({ specification, orgUnitCount }: SummaryProps) => (
    <dl className={styles.summary}>
        {[
            { label: i18n.t('Period range'), value: formatPeriodRange(specification.dataset) },
            { label: i18n.t('Organisation units'), value: orgUnitCount },
            ...getParameters(specification),
        ].map(({ label, value }) => (
            <div key={label}>
                <dt>{label}</dt>
                <dd>{value ?? '—'}</dd>
            </div>
        ))}
    </dl>
);
