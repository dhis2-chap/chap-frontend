import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getJobRequest } from '@dhis2-chap/ui';
import { downloadJobRequest } from './useDownloadJobRequest';

vi.mock('@dhis2-chap/ui', () => ({ getJobRequest: vi.fn() }));
vi.mock('@dhis2/app-runtime', () => ({ useAlert: vi.fn() }));
vi.mock('@dhis2/d2-i18n', () => ({ default: { t: (text: string) => text } }));

describe('downloadJobRequest', () => {
    const link = { href: '', download: '', click: vi.fn(), remove: vi.fn() };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('document', {
            createElement: vi.fn(() => link),
            body: { appendChild: vi.fn() },
        });
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:request');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('downloads the original payload as JSON with the job ID in the filename', async () => {
        const payload = { name: 'Failed evaluation', modelId: 'model', providedData: [{ value: 0 }] };
        vi.mocked(getJobRequest).mockResolvedValue(payload);

        await downloadJobRequest('failed-job');

        expect(getJobRequest).toHaveBeenCalledWith('failed-job');
        const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
        expect(blob.type).toBe('application/json');
        expect(JSON.parse(await blob.text())).toEqual(payload);
        expect(link.download).toBe('job-failed-job-request.json');
        expect(link.href).toBe('blob:request');
        expect(link.click).toHaveBeenCalledOnce();
        expect(link.remove).toHaveBeenCalledOnce();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:request');
    });

    it('does not download a file when the request is unavailable', async () => {
        const error = new Error('Request unavailable');
        vi.mocked(getJobRequest).mockRejectedValue(error);

        await expect(downloadJobRequest('old-job')).rejects.toBe(error);

        expect(URL.createObjectURL).not.toHaveBeenCalled();
        expect(link.click).not.toHaveBeenCalled();
    });

    it('releases the object URL even if starting the download fails', async () => {
        vi.mocked(getJobRequest).mockResolvedValue({ name: 'Failed prediction' });
        link.click.mockImplementationOnce(() => {
            throw new Error('Download failed');
        });

        await expect(downloadJobRequest('failed-job')).rejects.toThrow('Download failed');

        expect(link.remove).toHaveBeenCalledOnce();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:request');
    });
});
