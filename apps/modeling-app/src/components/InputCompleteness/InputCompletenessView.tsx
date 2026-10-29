import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
    Switch,
} from '@dhis2/ui';
import type { ObservationBase } from '@dhis2-chap/ui';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useOrgUnitsById } from '../../hooks/useOrgUnitsById';
import { calculateInputCompleteness, indexObservations, observationKey } from './inputCompleteness';
import styles from './InputCompletenessView.module.css';

export type InputCompletenessData = {
    observations: ObservationBase[];
    periods: string[];
    orgUnits: string[];
    variables: string[];
};

export const InputCompletenessView = ({ observations, periods, orgUnits, variables }: InputCompletenessData) => {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [showAll, setShowAll] = useState(false);
    const { data: orgUnitData } = useOrgUnitsById(orgUnits);
    const locationNames = useMemo(() => new Map(orgUnitData?.organisationUnits.map(unit => [unit.id, unit.displayName])), [orgUnitData]);
    const values = useMemo(() => indexObservations(observations), [observations]);
    const columns = useMemo(() => [...new Set(variables)], [variables]);
    const completeness = useMemo(
        () => calculateInputCompleteness(observations, periods, orgUnits, variables),
        [observations, periods, orgUnits, variables],
    );
    const selected = completeness.find(row => row.period === selectedPeriod) ?? completeness[completeness.length - 1];

    if (!selected?.expected) {
        return <NoticeBox title={i18n.t('No data to check')} />;
    }

    const withGaps = new Set(selected.missing.map(location => location.orgUnit));
    const rows = showAll
        ? [...new Set(orgUnits)].sort((a, b) => Number(withGaps.has(b)) - Number(withGaps.has(a)))
        : [...withGaps];

    const options: Highcharts.Options = {
        chart: { type: 'line', height: 280, animation: false },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: {
            categories: periods,
            title: { text: i18n.t('Period') },
            plotLines: [{ value: periods.indexOf(selected.period), color: '#a0adba', width: 1, dashStyle: 'Dash' }],
        },
        yAxis: { min: 0, max: 100, title: { text: i18n.t('Complete (%)') } },
        plotOptions: {
            series: {
                cursor: 'pointer',
                point: { events: { click: event => setSelectedPeriod(periods[event.point.index]) } },
            },
        },
        tooltip: {
            pointFormat: i18n.t('{{available}} of {{expected}} values', {
                available: '{point.custom.available}',
                expected: '{point.custom.expected}',
                interpolation: { escapeValue: false },
            }),
        },
        series: [{
            type: 'line',
            name: i18n.t('Completeness'),
            color: '#147cd7',
            data: completeness.map(row => ({
                y: row.completeness === null ? null : row.completeness * 100,
                custom: { available: row.available, expected: row.expected },
                marker: row.period === selected.period ? { radius: 6, fillColor: '#093371' } : undefined,
            })),
        }],
    };

    return (
        <>
            <p className={styles.description}>
                {i18n.t('Share of locations with a {{column}} value in each period.', { column: columns.join(', ') })}
            </p>
            <div className={styles.chart}>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </div>
            <SingleSelectField
                label={i18n.t('Show values for period')}
                helpText={i18n.t('Or click a point in the chart.')}
                selected={selected.period}
                onChange={({ selected }) => setSelectedPeriod(selected)}
                filterable
            >
                {completeness.map(row => (
                    <SingleSelectOption key={row.period} value={row.period} label={row.period} />
                ))}
            </SingleSelectField>
            <p className={styles.description}>
                {i18n.t('{{available}} of {{expected}} values present ({{percent}}%) · {{zeros}} zero · {{missing}} missing', {
                    available: selected.available,
                    expected: selected.expected,
                    percent: ((selected.completeness ?? 0) * 100).toFixed(1),
                    zeros: selected.zeros,
                    missing: selected.expected - selected.available,
                })}
            </p>
            <Switch
                label={i18n.t('Show all locations')}
                checked={showAll}
                onChange={({ checked }) => setShowAll(checked)}
            />
            {rows.length > 0 && (
                <DataTable scrollHeight="400px">
                    <DataTableHead>
                        <DataTableRow>
                            <DataTableColumnHeader fixed top="0">{i18n.t('Location')}</DataTableColumnHeader>
                            {columns.map(variable => (
                                <DataTableColumnHeader key={variable} fixed top="0">{variable}</DataTableColumnHeader>
                            ))}
                        </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                        {rows.map(orgUnit => (
                            <DataTableRow key={orgUnit}>
                                <DataTableCell>{locationNames.get(orgUnit) ?? orgUnit}</DataTableCell>
                                {columns.map((variable) => {
                                    const value = values.get(observationKey(selected.period, orgUnit, variable));
                                    return value === undefined
                                        ? <DataTableCell key={variable}><span className={styles.missing}>{i18n.t('Missing')}</span></DataTableCell>
                                        : <DataTableCell key={variable}>{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</DataTableCell>;
                                })}
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            )}
        </>
    );
};
