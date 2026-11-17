import { afterEach, expect, it, vi } from 'vitest';
import { JobsService, type JobDescription } from '@dhis2-chap/ui';
import { waitForDatasetImport } from './waitForDatasetImport';

vi.mock('@dhis2-chap/ui', () => ({
    JobsService: {
        getJobV1JobsJobIdGet: vi.fn(),
        getDatabaseResultV1JobsJobIdDatabaseResultGet: vi.fn(),
    },
}));

const getJob = vi.mocked(JobsService.getJobV1JobsJobIdGet);
const getResult = vi.mocked(JobsService.getDatabaseResultV1JobsJobIdDatabaseResultGet);

afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
});

it('waits for import success before reading the dataset id, including older status responses', async () => {
    vi.useFakeTimers();
    getJob.mockResolvedValueOnce({ status: 'STARTED' } as JobDescription)
        .mockResolvedValueOnce('SUCCESS' as unknown as JobDescription);
    getResult.mockResolvedValue({ id: 42 });

    const dataset = waitForDatasetImport('import-job');
    await vi.advanceTimersByTimeAsync(0);
    expect(getResult).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);
    await expect(dataset).resolves.toBe(42);
    expect(getResult).toHaveBeenCalledExactlyOnceWith('import-job');
});

it.each(['FAILURE', 'REVOKED'])('stops a %s import without reading a dataset id', async (status) => {
    getJob.mockResolvedValue({ status } as JobDescription);
    await expect(waitForDatasetImport('import-job')).rejects.toThrow('Dataset import failed or was cancelled');
    expect(getResult).not.toHaveBeenCalled();
});
