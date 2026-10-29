import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import type { ObservationBase } from '@dhis2-chap/ui';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useOrgUnitsById } from '../../hooks/useOrgUnitsById';
import { calculateInputCompleteness } from './inputCompleteness';
import styles from './InputCompletenessView.module.css';

export type InputCompletenessData = {
    observations: ObservationBase[];
    periods: string[];
    orgUnits: string[];
    variables: string[];
};

export const InputCompletenessView = ({ observations, periods, orgUnits, variables }: InputCompletenessData) => {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const { data: orgUnitData } = useOrgUnitsById(orgUnits);
    const locationNames = useMemo(() => new Map(orgUnitData?.organisationUnits.map(unit => [unit.id, unit.displayName])), [orgUnitData]);
    const completeness = useMemo(
        () => calculateInputCompleteness(observations, periods, orgUnits, variables),
        [observations, periods, orgUnits, variables],
    );
    const selected = completeness.find(row => row.period === selectedPeriod) ?? completeness[completeness.length - 1];

    if (!selected?.expected) {
        return <NoticeBox title={i18n.t('No data to check')} />;
    }

    const options: Highcharts.Options = {
        chart: { type: 'line', height: 280, animation: false },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: { categories: periods, title: { text: i18n.t('Period') } },
        yAxis: { min: 0, max: 100, title: { text: i18n.t('Complete (%)') } },
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
            })),
        }],
    };

    return (
        <>
            <p className={styles.description}>
                {i18n.t('Share of values present in each period, across all locations and variables.')}
            </p>
            <div className={styles.chart}>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </div>
            <SingleSelectField
                label={i18n.t('Period')}
                selected={selected.period}
                onChange={({ selected }) => setSelectedPeriod(selected)}
                filterable
            >
                {completeness.map(row => (
                    <SingleSelectOption key={row.period} value={row.period} label={row.period} />
                ))}
            </SingleSelectField>
            <p className={styles.description}>
                {i18n.t('{{available}} of {{expected}} values ({{percent}}%)', {
                    available: selected.available,
                    expected: selected.expected,
                    percent: ((selected.completeness ?? 0) * 100).toFixed(1),
                })}
            </p>
            {selected.missing.length > 0 && (
                <ul className={styles.gaps}>
                    {selected.missing.map(location => (
                        <li key={location.orgUnit}>
                            <strong title={location.orgUnit}>{locationNames.get(location.orgUnit) ?? location.orgUnit}</strong>
                            {': '}
                            {location.variables.join(', ')}
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
};
