import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { Card, getPeriodNameFromId, Tag } from '@dhis2-chap/ui';
import { format } from 'date-fns';
import { useDataset } from '../../../hooks/useDataset';
import { useDhis2PeriodSettings } from '../../../hooks/useDhis2PeriodSettings';
import { ChapErrorNotice } from '../../ChapErrorNotice';
import { getInputPeriods, getInputVariables } from '../../InputCompleteness/inputCompleteness';
import { InputCompletenessView } from '../../InputCompleteness/InputCompletenessView';
import styles from './DatasetDetails.module.css';

const EMPTY_VALUE = '-';

export const DatasetDetails = ({ datasetId }: { datasetId: number }) => {
    // isInitialLoading stays false for an invalid id, which disables the query, so it falls through to the error.
    const { data: dataset, error, isInitialLoading } = useDataset(datasetId);
    const { settings } = useDhis2PeriodSettings();
    const periods = useMemo(
        () => getInputPeriods(dataset?.firstPeriod, dataset?.lastPeriod, settings.calendar),
        [dataset, settings.calendar],
    );

    if (isInitialLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (error || !dataset) {
        return <ChapErrorNotice error={error} title={i18n.t('Error loading dataset')} />;
    }

    // Chap Core < 2.6.0 does not save a target on the dataset.
    const targetColumn = dataset.targetColumn ?? 'disease_cases';

    return (
        <Card className={styles.container}>
            <h2 className={styles.title}>{dataset.name}</h2>
            <p className={styles.description}>
                {i18n.t('Created {{created}} · {{first}} to {{last}} · {{locations}} locations · target {{target}}', {
                    created: dataset.created ? format(new Date(dataset.created), 'dd.MM.yyyy, HH:mm') : EMPTY_VALUE,
                    first: dataset.firstPeriod ? getPeriodNameFromId(dataset.firstPeriod, 'short') : EMPTY_VALUE,
                    last: dataset.lastPeriod ? getPeriodNameFromId(dataset.lastPeriod, 'short') : EMPTY_VALUE,
                    locations: dataset.orgUnits?.length ?? 0,
                    target: targetColumn,
                })}
            </p>
            <div className={styles.covariates}>
                {dataset.covariates?.map(covariate => <Tag key={covariate}>{covariate}</Tag>)}
            </div>
            {!!dataset.maskedRanges?.length && (
                <NoticeBox title={i18n.t('Masked ranges')} dataTest="dataset-masked-ranges">
                    <p>{i18n.t('Disease case values in these inclusive ranges were removed from this dataset. To change the ranges, create a new dataset.')}</p>
                    <ul>
                        {dataset.maskedRanges.map((range, index) => (
                            <li key={index}>
                                {range.name && <strong>{`${range.name} — `}</strong>}
                                {i18n.t('{{start}} to {{end}}', {
                                    start: getPeriodNameFromId(range.start, 'short'),
                                    end: getPeriodNameFromId(range.end, 'short'),
                                })}
                            </li>
                        ))}
                    </ul>
                </NoticeBox>
            )}
            <InputCompletenessView
                observations={dataset.observations}
                periods={periods}
                orgUnits={dataset.orgUnits ?? []}
                variables={getInputVariables(targetColumn, dataset.covariates)}
            />
        </Card>
    );
};
