import type { JobDescription } from '../models/JobDescription';
import type { CancelablePromise } from '../core/CancelablePromise';
import { JobsService as GeneratedJobsService } from './JobsService';

export class JobsService {
    public static listJobsJobsGet(
        ids?: Array<string>,
        status?: Array<string>,
        type?: string,
    ): CancelablePromise<Array<JobDescription>> {
        return GeneratedJobsService.listJobsV1JobsGet(ids, status, type);
    }

    public static deleteJobJobsJobIdDelete(
        jobId: string,
    ): CancelablePromise<Record<string, any>> {
        return GeneratedJobsService.deleteJobV1JobsJobIdDelete(jobId);
    }

    public static cancelJobJobsJobIdCancelPost(
        jobId: string,
    ): CancelablePromise<Record<string, any>> {
        return GeneratedJobsService.cancelJobV1JobsJobIdCancelPost(jobId);
    }

    public static getLogsJobsJobIdLogsGet(jobId: string): CancelablePromise<string> {
        return GeneratedJobsService.getLogsV1JobsJobIdLogsGet(jobId);
    }
}
