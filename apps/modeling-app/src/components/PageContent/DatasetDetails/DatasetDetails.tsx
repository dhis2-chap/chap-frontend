import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { Card, Tag } from '@dhis2-chap/ui';
import type { DataSetWithObservations } from '@dhis2-chap/ui';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useDataset } from '../../../hooks/useDataset';
import { useOrgUnitsById } from '../../../hooks/useOrgUnitsById';
import { ChapErrorNotice } from '../../ChapErrorNotice';
import { calculateInputCompleteness, getInputPeriods } from '../../InputCompleteness/inputCompleteness';
import styles from './DatasetDetails.module.css';

const formatTimestamp = (value?: string | null) => (
    value ? new Date(value).toLocaleString() : i18n.t('Unavailable')
);

const Completeness = ({ dataset }: { dataset: DataSetWithObservations }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const orgUnitIds = useMemo(() => dataset.orgUnits ?? [], [dataset.orgUnits]);
    const variables = useMemo(() => dataset.covariates ?? [], [dataset.covariates]);
    const { data: orgUnits } = useOrgUnitsById(orgUnitIds);
    const locationNames = useMemo(() => new Map(orgUnits?.organisationUnits.map(unit => [unit.id, unit.displayName])), [orgUnits]);
    const periods = useMemo(
        () => getInputPeriods(dataset.firstPeriod ?? '', dataset.lastPeriod ?? '', dataset.periodType),
        [dataset.firstPeriod, dataset.lastPeriod, dataset.periodType],
    );
    const completeness = useMemo(
        () => calculateInputCompleteness(dataset.observations, periods, orgUnitIds, variables),
        [dataset.observations, periods, orgUnitIds, variables],
    );
    const selected = completeness.find(row => row.period === selectedPeriod) ?? completeness[completeness.length - 1];

    if (!selected?.expected) {
        return (
            <NoticeBox title={i18n.t('Completeness unavailable')}>
                {i18n.t('The dataset has no periods, locations or variables to check.')}
            </NoticeBox>
        );
    }

    const options: Highcharts.Options = {
        chart: { type: 'line', height: 280, animation: false },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: { categories: periods, title: { text: i18n.t('Reporting period') } },
        yAxis: { min: 0, max: 100, title: { text: i18n.t('Available values (%)') } },
        tooltip: {
            pointFormat: i18n.t('Available{{colon}} {{available}}<br/>Completeness{{colon}} {{completeness}}', {
                colon: ':',
                available: '{point.custom.available} / {point.custom.expected}',
                completeness: '{point.y:.1f}%',
                interpolation: { escapeValue: false },
            }),
        },
        series: [{
            type: 'line',
            name: i18n.t('Input-data availability'),
            color: '#147cd7',
            data: completeness.map(row => ({
                y: row.completeness === null ? null : row.completeness * 100,
                custom: { available: row.available, expected: row.expected },
            })),
        }],
    };

    return (
        <>
            <p className={styles.description}>
                {i18n.t('Share of finite numeric values, including zero, for each location and variable in this dataset. Locations with no values at all are not part of the dataset and are not counted.')}
            </p>
            <div className={styles.chart}>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </div>
            <SingleSelectField
                label={i18n.t('Inspect reporting period')}
                selected={selected.period}
                onChange={({ selected }) => setSelectedPeriod(selected)}
                filterable
            >
                {completeness.map(row => (
                    <SingleSelectOption key={row.period} value={row.period} label={row.period} />
                ))}
            </SingleSelectField>
            <p className={styles.description}>
                {i18n.t('{{available}} available / {{expected}} expected observations ({{percent}}%); {{missing}} missing.', {
                    available: selected.available,
                    expected: selected.expected,
                    percent: ((selected.completeness ?? 0) * 100).toFixed(1),
                    missing: selected.expected - selected.available,
                })}
            </p>
            {selected.missing.length ? (
                <>
                    <strong>{i18n.t('Missing values by location and variable')}</strong>
                    <ul className={styles.gaps}>
                        {selected.missing.map(location => (
                            <li key={location.orgUnit}>
                                <strong title={location.orgUnit}>{locationNames.get(location.orgUnit) ?? location.orgUnit}</strong>
                                {': '}
                                {location.variables.join(', ')}
                            </li>
                        ))}
                    </ul>
                </>
            ) : <p className={styles.description}>{i18n.t('No missing values in this period.')}</p>}
        </>
    );
};

export const DatasetDetails = ({ datasetId }: { datasetId: number }) => {
    const { data: dataset, error, isLoading } = useDataset(datasetId);

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
            <Completeness dataset={dataset} />
        </Card>
    );
};
