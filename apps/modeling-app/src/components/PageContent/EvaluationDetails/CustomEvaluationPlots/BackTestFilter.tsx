import { useOrgUnitsById } from '@/hooks/useOrgUnitsById';
import { MenuItem, SingleSelect } from '@dhis2/ui';
import { getPeriodNameFromId } from '@dhis2-chap/ui';
import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import styles from './CustomEvaluationPlotsWidget.module.css';
import { FacetCoordinates } from '@/components/BacktestsTable/hooks/useFacetCoordinates';
import { toSplitPeriodId } from './splitPeriodId';

const formatHorizon = (distance: number) => i18n.t('{{count}} period ahead', {
    count: distance,
    defaultValue: '{{count}} period ahead',
    defaultValue_plural: '{{count}} periods ahead',
});

type Props = {
    facetCoords?: FacetCoordinates;
    periodType?: string | null;
    filterLocation?: string;
    filterSplitPeriod?: string;
    filterHorizonPeriod?: string;
    setFilterLocation: (val: string | undefined) => void;
    setFilterSplitPeriod: (val: string | undefined) => void;
    setFilterHorizonPeriod: (val: string | undefined) => void;
};

export const BackTestFilter = ({
    facetCoords, periodType, filterLocation, filterSplitPeriod, filterHorizonPeriod,
    setFilterLocation, setFilterSplitPeriod, setFilterHorizonPeriod,
}: Props) => {
    const splitPeriodOptions = useMemo(() =>
        (facetCoords?.split_period ?? []).map((val) => {
            const periodId = toSplitPeriodId(val, periodType);
            return { value: val, label: periodId ? getPeriodNameFromId(periodId) : val };
        }),
    [facetCoords?.split_period, periodType],
    );

    const horizonOptions = useMemo(() =>
        (facetCoords?.horizon_distance ?? []).map(val => ({
            value: String(val),
            label: formatHorizon(val),
        })),
    [facetCoords?.horizon_distance],
    );

    const orgUnitIds = useMemo(() => facetCoords?.location ?? [], [facetCoords?.location]);
    const organisationUnits = useOrgUnitsById(orgUnitIds);
    const isOrgUnitsLoading = organisationUnits.isLoading || false;

    const orgUnitOptions = useMemo(() =>
        organisationUnits.data?.organisationUnits.map(ou => ({
            label: ou.displayName,
            value: ou.id,
        })) ?? [],
    [organisationUnits.data?.organisationUnits],
    );

    const showLocation = facetCoords?.location && facetCoords.location.length > 0;
    const showSplitPeriod = facetCoords?.split_period && facetCoords.split_period.length > 0;
    const showHorizon = facetCoords?.horizon_distance && facetCoords.horizon_distance.length > 0;

    return (
        <div className={styles.filtersRow}>

            {showLocation && (
                <SingleSelect
                    className={styles.singleSelectContainer}
                    dense
                    clearable
                    clearText={i18n.t('Clear')}
                    dataTest="evaluation-plot-location-select"
                    placeholder={i18n.t('Select organisation unit')}
                    selected={filterLocation}
                    loading={isOrgUnitsLoading}
                    disabled={isOrgUnitsLoading}
                    onChange={e => setFilterLocation(e.selected || undefined)}
                >
                    {orgUnitOptions.map(({ value, label }) => (
                        <MenuItem key={value} value={value} label={label} />
                    ))}
                </SingleSelect>
            )}

            {showSplitPeriod && (
                <SingleSelect
                    className={styles.singleSelectContainer}
                    dense
                    clearable
                    clearText={i18n.t('Clear')}
                    dataTest="evaluation-plot-split-period-select"
                    placeholder={i18n.t('Select split period')}
                    selected={filterSplitPeriod}
                    onChange={e => setFilterSplitPeriod(e.selected || undefined)}
                >
                    {splitPeriodOptions.map(({ value, label }) => (
                        <MenuItem key={value} value={value} label={label} />
                    ))}
                </SingleSelect>
            )}

            {showHorizon && (
                <SingleSelect
                    className={styles.singleSelectContainer}
                    dense
                    clearable
                    clearText={i18n.t('Clear')}
                    dataTest="evaluation-plot-horizon-select"
                    placeholder={i18n.t('Select forecast horizon')}
                    selected={filterHorizonPeriod}
                    onChange={e => setFilterHorizonPeriod(e.selected || undefined)}
                >
                    {horizonOptions.map(({ value, label }) => (
                        <MenuItem key={value} value={value} label={label} />
                    ))}
                </SingleSelect>
            )}
        </div>
    );
};
