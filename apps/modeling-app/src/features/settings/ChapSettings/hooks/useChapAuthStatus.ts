import { useModels } from '../../../../hooks/useModels';

/**
 * `/system/info` is public, so a reachable server says nothing about whether the
 * configured API token works. Probe an authenticated endpoint to tell
 * "reachable" apart from "authenticated". Reuses the shared models query so no
 * extra request is made.
 */
export const useChapAuthStatus = () => {
    const { error, isLoading } = useModels();

    return {
        isUnauthorized: error?.status === 401,
        isLoading,
    };
};
