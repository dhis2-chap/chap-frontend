import React from 'react'

import styles from "./OrgUnitSelector.module.css";
import OrgUnitTree from './components/OrgUnitTree';
import OrgUnitLevel from './components/OrgUnitLevel';
import { IOrgUnitLevel } from './interfaces/orgUnit';

interface OrgUnitSelectorProps {
  orgUnits: any[],
  setOrgUnits: (orgUnits: any) => void
  orgUnitLevel : IOrgUnitLevel | undefined,
  setOrgUnitLevel : (level : IOrgUnitLevel) => void
}

const OrgUnitSelector = ({ setOrgUnits, orgUnits, orgUnitLevel, setOrgUnitLevel }: OrgUnitSelectorProps) => {

  const onChangeOrgUnitTree = (selected: any) => {
    if (selected.checked) {
      setOrgUnits([...orgUnits, selected])
    }
    else {
      setOrgUnits(orgUnits.filter((e: any) => e.path !== selected.path))
    }
  }


  //checks that all selected orgUnits are on the same level
  function orgUnitsSelectedIsValid() {
    if (orgUnits.length === 0) {
      return true;
    }

    const firstElement = (orgUnits[0] as any).path.split('/').length;
    return orgUnits.every(
      (innerArray) =>
        (innerArray as any).path.split('/').length === firstElement
    );
  }


  return (
    <>
      <OrgUnitTree
        selectedOrgUnits={orgUnits}
        onChange={(selected: any) => { onChangeOrgUnitTree(selected) }}
      />
      {!orgUnitsSelectedIsValid() && (
        <p className={styles.error}>
          Only select organization units that are one the same level.
        </p>
      )}
      <OrgUnitLevel orgUnitLevels={orgUnitLevel} onChange={setOrgUnitLevel} />
    </>
  );
}

export default OrgUnitSelector