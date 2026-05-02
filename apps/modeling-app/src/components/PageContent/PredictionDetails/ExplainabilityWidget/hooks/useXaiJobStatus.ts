import { useQuery } from '@tanstack/react-query'
import { JobsService } from '@dhis2-chap/ui'

const TERMINAL_STATUSES = new Set(['SUCCESS', 'FAILURE', 'REVOKED'])

const POLL_INTERVAL_MS = 2000

export type JobTerminalStatus = 'SUCCESS' | 'FAILURE' | 'REVOKED'

export const useXaiJobStatus = (jobId: string | null) => {
    const { data: status } = useQuery({
        queryKey: ['jobStatus', jobId],
        queryFn: () => JobsService.getJobStatusV1JobsJobIdGet(jobId!),
        enabled: !!jobId,
        refetchInterval: (data) =>
            TERMINAL_STATUSES.has(data as string) ? false : POLL_INTERVAL_MS,
    })

    return {
        status,
        isRunning: !!jobId && !TERMINAL_STATUSES.has(status as string),
    }
}
