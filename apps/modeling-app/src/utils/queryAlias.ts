import { useDataEngine } from '@dhis2/app-runtime';

type DataEngine = ReturnType<typeof useDataEngine>;

export type ResourceQuery = {
    resource: string;
    params: Record<string, string | number | boolean>;
};

const buildTargetPath = ({ resource, params }: ResourceQuery): string => {
    const search = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)]),
    );
    return `/api/${resource}?${search.toString()}`;
};

const createQueryAlias = async (
    dataEngine: DataEngine,
    target: string,
): Promise<string> => {
    const aliasResult = await dataEngine.mutate({
        // Query aliases are unversioned in DHIS2 2.42; escape the app-runtime
        // version prefix so older instances resolve /api/query/alias.
        resource: '../query/alias',
        type: 'create' as const,
        data: { target },
    });

    const aliasId = (aliasResult as { id?: string }).id;

    if (!aliasId) {
        throw new Error('Failed to create query alias: no id in response');
    }

    return aliasId;
};

const queryViaAlias = async <T>(
    dataEngine: DataEngine,
    target: string,
): Promise<T> => {
    const aliasId = await createQueryAlias(dataEngine, target);
    const response = await dataEngine.query({
        response: {
            // See createQueryAlias for why this intentionally uses ../.
            resource: `../query/alias/${aliasId}`,
        },
    });

    return (response as { response: T }).response;
};

export const queryWithAliasFallback = async <T>(
    dataEngine: DataEngine,
    query: ResourceQuery,
): Promise<T> => {
    try {
        return await queryViaAlias<T>(dataEngine, buildTargetPath(query));
    } catch (error) {
        console.warn(
            `Query alias request for ${query.resource} failed, falling back to a direct query.`,
            'This may fail for large queries that exceed URL length limits.',
            error,
        );
        const response = await dataEngine.query({ response: query });
        return (response as { response: T }).response;
    }
};
