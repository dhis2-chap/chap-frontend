import { useRoute } from './useRoute';
import { useChapStatus } from '../features/settings/ChapSettings/hooks/useChapStatus';
import { isVersionCompatible } from '../utils/compareVersions';

type UseMinimumChapVersionParams = {
    version: string;
};

type UseMinimumChapVersionResult = {
    /** Whether the server version meets the minimum requirement */
    isSupported: boolean;
    /** Whether we're still fetching the server version */
    isLoading: boolean;
    /** Error if the version check failed */
    error: unknown;
    /** The actual server version (if available) */
    serverVersion: string | undefined;
};

export const useMinimumChapVersion = ({
    version,
}: UseMinimumChapVersionParams): UseMinimumChapVersionResult => {
    const { route } = useRoute();
    const { status, isLoading, error } = useChapStatus({ route });

    const isSupported = status
        ? isVersionCompatible(status.chap_core_version, version)
        : false;

    return {
        isSupported,
        isLoading,
        error,
        serverVersion: status?.chap_core_version,
    };
};
