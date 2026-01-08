import i18n from '@dhis2/d2-i18n';
import { useEffect } from 'react';
import { OrganisationUnitTree } from '@dhis2/ui';

import React from 'react';
import { useOrgUnitRoots } from '../../../hooks/useOrgUnitRoots';

interface OrgUnitTreeProps {
    selectedOrgUnits: any[];
    onChange: (orgUnit: any) => void;
}

const OrgUnitTree = ({ selectedOrgUnits, onChange }: OrgUnitTreeProps) => {
    const { roots, error } = useOrgUnitRoots();

    // Set for root node as default
    useEffect(() => {
        if (roots && !selectedOrgUnits) {
            const [root] = roots;
            onChange({ ...root, selected: [root.path] });
        }
    }, [roots]);

    // The warnings "The query should be static, don't create it within the render loop!"
    // comes from the OrganisationUnitTree component:
    // https://dhis2.slack.com/archives/C0BP0RABF/p1641544953003000
    return roots ? (
        <div>
            <h3>{i18n.t('Organisation units')}</h3>
            <OrganisationUnitTree
                roots={roots.map((r: any) => r.id)}
                selected={selectedOrgUnits?.map((e: any) => e.path)}
                onChange={onChange}
                initiallyExpanded={roots.map((r: any) => r.path)}
            />
        </div>
    ) : error ? (
        <div>{error.message}</div>
    ) : null;
};

export default OrgUnitTree;
