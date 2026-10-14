import type { ReactNode } from 'react';
import { Menu, MenuItem } from '@dhis2/ui';
import { PredictionOrgUnitSeries } from '../../../interfaces/Prediction';
import styles from './OrgUnitMenu.module.css';

interface OrgUnitMenuProps {
    series: Pick<PredictionOrgUnitSeries, 'orgUnitId' | 'orgUnitName'>[];
    selectedOrgUnitId: string | undefined;
    onSelect: (orgUnitId: string) => void;
    disabled?: boolean;
    getSuffix?: (orgUnitId: string) => ReactNode;
}

export const OrgUnitMenu = ({
    series,
    selectedOrgUnitId,
    onSelect,
    disabled,
    getSuffix,
}: OrgUnitMenuProps) => (
    <div className={styles.sidebar}>
        <Menu dense>
            {series.map(s => (
                <MenuItem
                    active={!disabled && selectedOrgUnitId === s.orgUnitId}
                    disabled={disabled}
                    key={s.orgUnitId}
                    label={s.orgUnitName}
                    suffix={getSuffix?.(s.orgUnitId)}
                    onClick={() => onSelect(s.orgUnitId)}
                />
            ))}
        </Menu>
    </div>
);
