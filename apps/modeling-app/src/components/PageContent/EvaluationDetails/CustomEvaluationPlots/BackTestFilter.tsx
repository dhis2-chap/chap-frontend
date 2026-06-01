import { useOrgUnitsById } from "@/hooks/useOrgUnitsById";
import { MenuItem, SingleSelect } from "@dhis2/ui";
import { useMemo,useState } from "react";
import i18n from '@dhis2/d2-i18n'
import styles from './CustomEvaluationPlotsWidget.module.css'



type Props = {
    split_periods: string[];
    locations: string[];
    filterLocation: string | undefined;
    filterSplitPeriod: string | undefined;
    setFilterLocation: (location: string | undefined) => void;
    setFilterSplitPeriod: (splitPeriod: string | undefined) => void;
}

export const BackTestFilter = ({ split_periods, locations, filterLocation, filterSplitPeriod, setFilterLocation, setFilterSplitPeriod }: Props) => {
    const organisationUnits = useOrgUnitsById(locations);
    
    
    const orgUnitOptions = useMemo(() => {
        return organisationUnits.data?.organisationUnits.map(ou => ({
            label: ou.displayName,
            value: ou.id,
        })) ?? [];
    }, [organisationUnits.data?.organisationUnits]);

    

    return (
        <div style={{ display: 'flex' , gap: '16px'}}>

            <SingleSelect
                className={styles.singleSelectContainer}
                dense
                placeholder={i18n.t('Select organisation unit')}
                selected={filterLocation}
                onChange={(e) => {
                    setFilterLocation(e.selected);
                    console.log('Selected location:', e.selected);
                }}
            >
                {orgUnitOptions.map(option => (
                    <MenuItem
                        key={option.value}
                        value={option.value}
                        label={option.label}
                    />
                ))}
            </SingleSelect>

                <SingleSelect
                    className={styles.singleSelectContainer}
                    dense
                    placeholder={i18n.t('Select split period')}
                    selected={filterSplitPeriod}
                    onChange={(e) => {
                        setFilterSplitPeriod(e.selected);
                        console.log('Selected split period:', e.selected);
                    }}
                >
                    {split_periods.map(option => (
                        <MenuItem
                            key={option}
                            value={option}
                            label={option}
                        />
                    ))}
                </SingleSelect>
            </div>
        
    );
};