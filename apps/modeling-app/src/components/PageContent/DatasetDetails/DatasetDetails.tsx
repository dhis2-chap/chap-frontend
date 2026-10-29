import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader } from '@dhis2/ui';
import { Card, Tag } from '@dhis2-chap/ui';
import { useDataset } from '../../../hooks/useDataset';
import { ChapErrorNotice } from '../../ChapErrorNotice';
import { getInputPeriods } from '../../InputCompleteness/inputCompleteness';
import { InputCompletenessView } from '../../InputCompleteness/InputCompletenessView';
import styles from './DatasetDetails.module.css';

const formatTimestamp = (value?: string | null) => (
    value ? new Date(value).toLocaleString() : i18n.t('Unavailable')
);

export const DatasetDetails = ({ datasetId }: { datasetId: number }) => {
    const { data: dataset, error, isLoading } = useDataset(datasetId);
    const periods = useMemo(
        () => (dataset ? getInputPeriods(dataset.firstPeriod ?? '', dataset.lastPeriod ?? '', dataset.periodType) : []),
        [dataset],
    );

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (error || !dataset) {
        return <ChapErrorNotice error={error} title={i18n.t('Error loading dataset')} />;
    }

    return (
        <Card className={styles.container}>
            <h2 className={styles.title}>{dataset.name}</h2>
            <p className={styles.description}>
                {i18n.t('Created {{created}} · {{first}} to {{last}} · {{locations}} locations', {
                    created: formatTimestamp(dataset.created),
                    first: dataset.firstPeriod ?? '-',
                    last: dataset.lastPeriod ?? '-',
                    locations: dataset.orgUnits?.length ?? 0,
                    interpolation: { escapeValue: false },
                })}
            </p>
            <div className={styles.covariates}>
                {dataset.covariates?.map(covariate => <Tag key={covariate}>{covariate}</Tag>)}
            </div>
            <h3 className={styles.subtitle}>{i18n.t('Data completeness')}</h3>
            <InputCompletenessView
                observations={dataset.observations}
                periods={periods}
                orgUnits={dataset.orgUnits ?? []}
                variables={dataset.covariates ?? []}
            />
        </Card>
    );
};
