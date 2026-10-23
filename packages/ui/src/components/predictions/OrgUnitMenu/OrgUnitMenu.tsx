import type { ReactNode } from 'react';
import { Menu, MenuItem } from '@dhis2/ui';
import { PredictionOrgUnitSeries } from '../../../interfaces/Prediction';
import styles from './OrgUnitMenu.module.css';

interface OrgUnitMenuProps {
    orgUnits: Pick<PredictionOrgUnitSeries, 'orgUnitId' | 'orgUnitName'>[];
    selectedOrgUnitId: string | undefined;
    onSelect: (orgUnitId: string) => void;
    disabled?: boolean;
    getSuffix?: (orgUnitId: string) => ReactNode;
}

export const OrgUnitMenu = ({
    orgUnits,
    selectedOrgUnitId,
    onSelect,
    disabled,
    getSuffix,
}: OrgUnitMenuProps) => (
    <div className={styles.sidebar}>
        <Menu dense>
            {orgUnits.map(orgUnit => (
                <MenuItem
                    active={!disabled && selectedOrgUnitId === orgUnit.orgUnitId}
                    disabled={disabled}
                    key={orgUnit.orgUnitId}
                    label={orgUnit.orgUnitName}
                    suffix={getSuffix?.(orgUnit.orgUnitId)}
                    onClick={() => onSelect(orgUnit.orgUnitId)}
                />
            ))}
        </Menu>
    </div>
);
