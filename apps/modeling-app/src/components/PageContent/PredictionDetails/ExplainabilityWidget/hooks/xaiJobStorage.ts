const key = (predictionId: number, xaiMethod: string) =>
    `chap_xai_job_${predictionId}_${xaiMethod}`

export const xaiJobStorage = {
    get: (predictionId: number, xaiMethod: string): string | null =>
        sessionStorage.getItem(key(predictionId, xaiMethod)),
    set: (predictionId: number, xaiMethod: string, jobId: string): void => {
        sessionStorage.setItem(key(predictionId, xaiMethod), jobId)
    },
    clear: (predictionId: number, xaiMethod: string): void => {
        sessionStorage.removeItem(key(predictionId, xaiMethod))
    },
}
