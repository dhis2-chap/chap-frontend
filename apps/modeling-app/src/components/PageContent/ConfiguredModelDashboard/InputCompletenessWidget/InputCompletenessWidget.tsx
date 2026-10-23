import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, InputField, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { DatasetsService, Widget } from '@dhis2-chap/ui';
import type { ApiError, DataSetWithObservations, PredictionInfo, PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { getChapErrorLabel } from '../../../../utils/chapErrors';
import { useOrgUnitsById } from '../../../../hooks/useOrgUnitsById';
import { calculateInputCompleteness, getExpectedVariables, getInputPeriods } from './inputCompleteness';
import styles from './InputCompletenessWidget.module.css';

const formatTimestamp = (value?: string | null) => (
    value ? new Date(value).toLocaleString() : i18n.t('Unavailable')
);

type SnapshotProps = {
    prediction: PredictionInfo;
    setup: PredictionSetupReadWithPredictions;
};

const SnapshotChart = ({ dataset, setup }: { dataset: DataSetWithObservations; setup: PredictionSetupReadWithPredictions }) => {
    const [start, setStart] = useState(dataset.firstPeriod ?? '');
    const [end, setEnd] = useState(dataset.lastPeriod ?? '');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const { data: orgUnits } = useOrgUnitsById(setup.orgUnits);
    const locationNames = useMemo(() => new Map(orgUnits?.organisationUnits.map(unit => [unit.id, unit.displayName])), [orgUnits]);
    const variables = useMemo(() => getExpectedVariables(setup.configuredModel), [setup.configuredModel]);
    const periodType = dataset.periodType ?? setup.periodType;
    const periods = useMemo(() => getInputPeriods(start, end, periodType), [start, end, periodType]);
    const completeness = useMemo(() => calculateInputCompleteness(
        dataset.observations, periods, setup.orgUnits, variables,
    ), [dataset.observations, periods, setup.orgUnits, variables]);
    const selected = completeness.find(row => row.period === selectedPeriod) ?? completeness[completeness.length - 1];
    const options: Highcharts.Options = {
        chart: { type: 'line', height: 280, animation: false },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: { categories: periods, title: { text: i18n.t('Reporting period') } },
        yAxis: { min: 0, max: 100, title: { text: i18n.t('Available values (%)') } },
        tooltip: {
            pointFormat: i18n.t('Available: {point.custom.available} / {point.custom.expected}<br/>Completeness: {point.y:.1f}%'),
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
                {i18n.t('Dataset: {{name}} (ID {{id}}). Dataset created: {{created}}.', {
                    name: dataset.name, id: dataset.id, created: formatTimestamp(dataset.created),
                    interpolation: { escapeValue: false },
                })}
            </p>
            <div className={styles.range}>
                <InputField
                    label={i18n.t('From reporting period')}
                    value={start}
                    onChange={({ value }) => setStart(value ?? '')}
                    helpText={i18n.t('For example, 202601 or 2026W01')}
                />
                <InputField
                    label={i18n.t('To reporting period')}
                    value={end}
                    onChange={({ value }) => setEnd(value ?? '')}
                    helpText={i18n.t('Inclusive; missing periods count as gaps')}
                />
            </div>
            <p className={styles.description}>
                {i18n.t('Expected per period: {{locations}} setup locations × {{variables}} model variables ({{names}}).', {
                    locations: new Set(setup.orgUnits).size, variables: variables.length, names: variables.join(', '),
                    interpolation: { escapeValue: false },
                })}
            </p>
            {!periods.length ? (
                <NoticeBox title={i18n.t('Reporting-period range unavailable')}>
                    {i18n.t('Enter a valid start and end period matching the dataset period type, with the start no later than the end.')}
                </NoticeBox>
            ) : !selected?.expected ? (
                <NoticeBox title={i18n.t('Completeness unavailable')}>
                    {i18n.t('Expected locations or model variables are missing. A zero expected count cannot establish completeness.')}
                </NoticeBox>
            ) : (
                <>
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
            )}
        </>
    );
};

const Snapshot = ({ prediction, setup }: SnapshotProps) => {
    const { data, error, isLoading, refetch } = useQuery<DataSetWithObservations, ApiError>({
        queryKey: ['input-completeness-dataset', prediction.datasetId],
        queryFn: () => DatasetsService.getDatasetV1CrudDatasetsDatasetIdGet(prediction.datasetId),
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    if (isLoading) return <CircularLoader small />;
    if (error || !data) {
        return (
            <NoticeBox error title={i18n.t('Unable to load saved input data')}>
                {getChapErrorLabel(error, i18n.t('The dataset may no longer be available.'))}
                <Button small onClick={() => refetch()}>{i18n.t('Retry')}</Button>
            </NoticeBox>
        );
    }
    return <SnapshotChart dataset={data} setup={setup} />;
};

type Props = {
    setup?: PredictionSetupReadWithPredictions;
    predictions: PredictionInfo[];
    isLoading: boolean;
    error: ApiError | null;
};

export const InputCompletenessWidget = ({ setup, predictions, isLoading, error }: Props) => {
    const [selectedRunId, setSelectedRunId] = useState('');
    const prediction = predictions.find(run => String(run.id) === selectedRunId) ?? predictions[0];

    return (
        <Widget header={i18n.t('Saved input-data completeness')} noncollapsible>
            <div className={styles.content}>
                <p className={styles.description}>
                    {i18n.t('Availability of finite numeric values in the saved input dataset, including zero. This does not indicate whether values are final, partially reported, or current in the upstream source. Timestamps below describe saved datasets and runs, not upstream updates.')}
                </p>
                {isLoading ? <CircularLoader small /> : error || !setup ? (
                    <NoticeBox error title={i18n.t('Unable to load prediction setup')}>
                        {getChapErrorLabel(error, i18n.t('Prediction setup unavailable.'))}
                    </NoticeBox>
                ) : !prediction ? (
                    <p className={styles.description}>{i18n.t('No saved input datasets yet. Run a prediction to inspect its inputs.')}</p>
                ) : (
                    <>
                        <SingleSelectField
                            label={i18n.t('Saved input snapshot')}
                            selected={String(prediction.id)}
                            onChange={({ selected }) => setSelectedRunId(selected)}
                        >
                            {predictions.map(run => (
                                <SingleSelectOption
                                    key={run.id}
                                    value={String(run.id)}
                                    label={i18n.t('Run {{run}} — created {{created}} — dataset {{dataset}}', {
                                        run: run.id, created: formatTimestamp(run.created), dataset: run.datasetId,
                                        interpolation: { escapeValue: false },
                                    })}
                                />
                            ))}
                        </SingleSelectField>
                        <Snapshot key={prediction.id} prediction={prediction} setup={setup} />
                    </>
                )}
            </div>
        </Widget>
    );
};
