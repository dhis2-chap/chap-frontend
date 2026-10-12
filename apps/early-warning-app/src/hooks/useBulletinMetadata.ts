import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';

type NamedItem = { id: string; displayName: string };
export const useBulletinMetadata = () => {
    const engine = useDataEngine();
    return useQuery({
        queryKey: ['early-warning', 'bulletin-metadata'],
        queryFn: async () => {
            const response = await engine.query({
                groups: { resource: 'userGroups', params: { fields: 'id,displayName', paging: false, order: 'displayName:asc' } },
                dashboards: { resource: 'dashboards', params: { fields: 'id,displayName', paging: false, order: 'displayName:asc' } },
            });
            return {
                groups: (response.groups as { userGroups: NamedItem[] }).userGroups,
                dashboards: (response.dashboards as { dashboards: NamedItem[] }).dashboards,
            };
        },
        staleTime: Infinity,
    });
};
