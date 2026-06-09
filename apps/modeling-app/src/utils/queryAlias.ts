import { useDataEngine } from '@dhis2/app-runtime';

type DataEngine = ReturnType<typeof useDataEngine>;

export const createQueryAlias = async (
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

    const alias = aliasResult as Record<string, unknown>;
    const aliasId = alias.id as string | undefined;

    if (!aliasId) {
        throw new Error('Failed to create query alias: no id in response');
    }

    return aliasId;
};

export const queryViaAlias = async <T>(
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
