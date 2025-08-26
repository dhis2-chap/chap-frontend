import { useApps } from "../hooks/useApps"
import { isDVVersionCompatible } from "./isAppVersionCompatible";

const DV_APP_KEY = 'data-visualizer';

export const useInstalledDVVersion = () => {
    const { apps, isLoading, error } = useApps({
        select: (apps) => apps.filter((app) => app.key === DV_APP_KEY),
    });

    const app = apps?.[0];
    const isCompatible = app ? isDVVersionCompatible(app.version) : false;

    return {
        version: app?.version,
        isCompatible,
        isLoading,
        error,
    }
}