import type { useDataEngine } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { ouIdHelper } from '../../OrganisationUnitSelector/modules/ouIdHelper';

export const ORG_UNIT_BATCH_SIZE = 200;

/** Resolve levels/groups before batching: explicit units are subtree boundaries when selectors are present. */
export const resolveOrgUnits = async (
    selection: string[],
    dataEngine: ReturnType<typeof useDataEngine>,
    onProgress?: (message: string) => void,
): Promise<string[]> => {
    const selectors = [...new Set(selection.filter(id => ouIdHelper.hasLevelPrefix(id) || ouIdHelper.hasGroupPrefix(id)))];
    const boundaries = new Set(selection.filter(id => !selectors.includes(id)));
    if (!selectors.length) return [...boundaries];

    const ids = new Set<string>();
    onProgress?.(i18n.t('Finding selected locations'));
    for (const selector of selectors) {
        const params: Record<string, string | number> = {};
        const id = ouIdHelper.removePrefix(selector);
        if (ouIdHelper.hasLevelPrefix(selector)) {
            if (/^\d+$/.test(id)) {
                params.level = Number(id);
            } else {
                const result = await dataEngine.query({ level: { resource: `organisationUnitLevels/${id}`, params: { fields: 'level' } } });
                params.level = (result.level as { level: number }).level;
            }
        } else {
            params.filter = `organisationUnitGroups.id:eq:${id}`;
        }

        for (let page = 1; ; page++) {
            const result = await dataEngine.query({
                units: {
                    resource: 'organisationUnits',
                    params: { ...params, fields: 'id,path', order: 'id:asc', paging: true, pageSize: ORG_UNIT_BATCH_SIZE, page },
                },
            });
            const { organisationUnits, pager } = result.units as {
                organisationUnits: { id: string; path: string }[];
                pager?: { pageCount: number };
            };
            for (const unit of organisationUnits) {
                if (!boundaries.size || unit.path.split('/').some(parent => boundaries.has(parent))) {
                    ids.add(unit.id);
                }
            }
            onProgress?.(i18n.t('Found {{count}} selected locations', { count: ids.size }));
            if (organisationUnits.length < ORG_UNIT_BATCH_SIZE || (pager && page >= pager.pageCount)) break;
        }
    }
    return [...ids];
};
