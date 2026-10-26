import { useMutation } from '@tanstack/react-query';
import { useAlert, useConfig } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { JobsService } from '@dhis2-chap/ui';
import { saveAs } from 'file-saver';

export const useDownloadJobDiagnostics = () => {
    const { appVersion, serverVersion, systemInfo } = useConfig();
    const { show: showSharingNote } = useAlert(
        i18n.t('Debug info downloaded. Logs may contain data values. Check the file before sharing.'),
        { warning: true, permanent: true },
    );
    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to download debug info. Please try again.'),
        { critical: true },
    );

    const { mutate, isLoading } = useMutation({
        mutationFn: async (jobId: string) => {
            const diagnostics = await JobsService.getJobDiagnosticsV1JobsJobIdDiagnosticsGet(jobId);
            const bundle = {
                ...diagnostics,
                client: {
                    appVersion: appVersion?.full ?? 'Unknown',
                    dhis2Version: serverVersion?.full ?? systemInfo?.version ?? 'Unknown',
                    browser: navigator.userAgent,
                },
            };
            saveAs(
                new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
                `job-${jobId}-debug-info.json`,
            );
        },
        onSuccess: () => showSharingNote(),
        onError: () => showErrorAlert(),
    });

    return { downloadDiagnostics: mutate, isLoading };
};
