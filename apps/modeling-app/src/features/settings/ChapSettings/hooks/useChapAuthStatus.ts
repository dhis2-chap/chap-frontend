import { ApiError, ModelSpecRead, ModelsService } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { isUnauthorizedError } from '../../../../utils/chapErrors';

/**
 * `/system/info` is public, so a reachable server says nothing about whether the
 * configured API token works. Probe an authenticated endpoint to tell
 * "reachable" apart from "authenticated".
 *
 * Deliberately not the shared `useModels` query: that one is cached for the whole
 * session, so a token rotated on the server since it resolved would still look
 * accepted. Probe on every mount instead, and report anything that is neither a
 * success nor a 401 as unverified rather than as a working token.
 */
export const useChapAuthStatus = () => {
    const { error, isLoading, isSuccess } = useQuery<ModelSpecRead[], ApiError>({
        queryKey: ['chapAuthProbe'],
        queryFn: () => ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet(),
        staleTime: 0,
        cacheTime: 0,
        retry: 0,
    });

    return {
        isUnauthorized: isUnauthorizedError(error),
        isAuthenticated: isSuccess,
        isLoading,
    };
};
