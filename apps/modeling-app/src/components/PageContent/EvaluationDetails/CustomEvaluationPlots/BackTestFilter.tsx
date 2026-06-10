import { useOrgUnitsById } from '@/hooks/useOrgUnitsById';
import { MenuItem, SingleSelect } from '@dhis2/ui';
import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import styles from './CustomEvaluationPlotsWidget.module.css';

type FacetCoords = {
    split_period?: string[];
    location?: string[];
    horizon_distance?: number[];
};

type Props = {
    facetCoords?: FacetCoords;
    filterLocation?: string;
    filterSplitPeriod?: string;
    filterHorizonPeriod?: string;
    visualizationId: string;
    setFilterLocation: (val: string | undefined) => void;
    setFilterSplitPeriod: (val: string | undefined) => void;
    setFilterHorizonPeriod: (val: string | undefined) => void;
};

export const BackTestFilter = ({
    facetCoords, filterLocation, filterSplitPeriod, filterHorizonPeriod,
    setFilterLocation, setFilterSplitPeriod, setFilterHorizonPeriod,
}: Props) => {
    const splitPeriodOptions = useMemo(() =>
        (facetCoords?.split_period ?? []).map(val => ({ value: val, label: val })),
    [facetCoords?.split_period],
    );

    const horizonOptions = useMemo(() =>
        (facetCoords?.horizon_distance ?? []).map(val => ({ value: String(val), label: String(val) })),
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
                    placeholder={i18n.t('Select horizon period')}
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
