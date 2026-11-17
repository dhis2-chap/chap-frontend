import i18n from '@dhis2/d2-i18n';
import { JobsService } from '@dhis2-chap/ui';

/** A backtest can only start once the dataset import has committed to the database. */
export const waitForDatasetImport = async (jobId: string | null): Promise<number> => {
    if (!jobId) throw new Error(i18n.t('Dataset import was rejected'));

    const deadline = Date.now() + 10 * 60 * 1000;
    while (Date.now() < deadline) {
        const job = await JobsService.getJobV1JobsJobIdGet(jobId);
        // Older Chap versions return only the status string.
        const status = typeof job === 'string' ? job : job.status;
        if (status === 'SUCCESS') {
            const result = await JobsService.getDatabaseResultV1JobsJobIdDatabaseResultGet(jobId);
            return result.id;
        }
        if (status === 'FAILURE' || status === 'REVOKED') {
            throw new Error(i18n.t('Dataset import failed or was cancelled. Check the job details on the Jobs page.'));
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error(i18n.t('Dataset import is still running. Check the Jobs page, then start an evaluation from the saved dataset.'));
};
