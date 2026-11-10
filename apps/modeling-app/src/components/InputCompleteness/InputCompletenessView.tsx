import { useMemo, useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
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
    colors,
} from '@dhis2/ui';
import type { ObservationBase, ObservationColumns } from '@dhis2-chap/ui';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useOrgUnitsById } from '../../hooks/useOrgUnitsById';
import { calculateInputCompleteness, indexObservations, observationKey } from './inputCompleteness';
import styles from './InputCompletenessView.module.css';

export type InputCompletenessData = {
    observations: ObservationBase[] | ObservationColumns;
    periods: string[];
    orgUnits: string[];
    variables: string[];
};

export const InputCompletenessView = ({ observations, periods, orgUnits, variables }: InputCompletenessData) => {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [showAll, setShowAll] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const chartRef = useRef<HighchartsReact.RefObject>(null);
    const { data: orgUnitData } = useOrgUnitsById(orgUnits);
    const locationNames = useMemo(() => new Map(orgUnitData?.organisationUnits.map(unit => [unit.id, unit.displayName])), [orgUnitData]);
    const values = useMemo(() => indexObservations(observations), [observations]);
    const completeness = useMemo(
        () => calculateInputCompleteness(values, periods, orgUnits, variables),
        [values, periods, orgUnits, variables],
    );
    const selected = completeness.find(row => row.period === selectedPeriod) ?? completeness[completeness.length - 1];

    if (!selected?.expected) {
        return <NoticeBox title={i18n.t('No data to check')} />;
    }

    const withGaps = new Set(selected.missing.map(location => location.orgUnit));
    const rows = showAll
        ? [...orgUnits].sort((a, b) => Number(withGaps.has(b)) - Number(withGaps.has(a)))
        : [...withGaps];

    const locationCount = orgUnits.length;
    const options: Highcharts.Options = {
        chart: {
            type: 'line',
            height: 280,
            animation: false,
            // The header holds the reset button, so hide the one Highcharts draws on the plot.
            zooming: { type: 'x', resetButton: { theme: { style: { display: 'none' } } } },
            events: {
                // Clicking anywhere on the plot selects the nearest period, not only on a point.
                click: (event) => {
                    const period = periods[Math.round((event as Highcharts.ChartClickEventObject).xAxis[0].value)];
                    if (period) setSelectedPeriod(period);
                },
                selection: (event) => {
                    setIsZoomed(!event.resetSelection);
                    return true;
                },
            },
        },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: variables.length > 1 },
        xAxis: {
            categories: periods,
            title: { text: i18n.t('Period') },
            plotLines: [{ value: periods.indexOf(selected.period), color: colors.grey500, width: 1, dashStyle: 'Dash' }],
        },
        yAxis: { min: 0, max: 100, title: { text: i18n.t('Complete (%)') } },
        plotOptions: {
            series: {
                cursor: 'pointer',
                point: { events: { click: event => setSelectedPeriod(periods[event.point.index]) } },
            },
        },
        tooltip: {
            shared: true,
            pointFormat: i18n.t('{{column}}{{colon}} {{available}} of {{expected}} locations', {
                column: '{series.name}',
                colon: ':',
                available: '{point.custom.available}',
                expected: locationCount,
                interpolation: { escapeValue: false },
            }) + '<br/>',
        },
        series: variables.map((variable, index) => ({
            type: 'line',
            name: variable,
            data: completeness.map(row => ({
                y: row.locationsByVariable[index] / locationCount * 100,
                custom: { available: row.locationsByVariable[index] },
                marker: row.period === selected.period ? { radius: 6 } : undefined,
            })),
        })),
    };

    return (
        <>
            <div className={styles.header}>
                <h3 className={styles.title}>{i18n.t('Data completeness')}</h3>
                <Button small secondary disabled={!isZoomed} onClick={() => chartRef.current?.chart.zoomOut()}>
                    {i18n.t('Reset zoom')}
                </Button>
            </div>
            <div className={styles.chart}>
                <HighchartsReact highcharts={Highcharts} options={options} ref={chartRef} />
            </div>
            <SingleSelectField
                label={i18n.t('Show values for period')}
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
                            {variables.map(variable => (
                                <DataTableColumnHeader key={variable} fixed top="0">{variable}</DataTableColumnHeader>
                            ))}
                        </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                        {rows.map(orgUnit => (
                            <DataTableRow key={orgUnit}>
                                <DataTableCell>{locationNames.get(orgUnit) ?? orgUnit}</DataTableCell>
                                {variables.map((variable) => {
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
