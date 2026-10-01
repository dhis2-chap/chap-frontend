import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { useAlert } from '@dhis2/app-runtime';
import { FlyoutMenu, IconAdd16, IconDownload16, IconDuplicate16, IconMore16, IconView16, MenuItem } from '@dhis2/ui';
import { BacktestsService, BacktestSpecificationSummary, OverflowButton } from '@dhis2-chap/ui';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { benchmarkCsv } from './benchmarkUtils';

export const BenchmarkActionsMenu = ({ specification }: { specification: BacktestSpecificationSummary }) => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const detailsPath = `/evaluate/benchmarks/${specification.id}`;
    const { show: showDownloadError } = useAlert(i18n.t('Could not download benchmark CSV. Try again.'), { critical: true });
    const download = useMutation({
        mutationFn: async () => {
            // The overview only contains counts; load the current runs when downloading.
            const benchmark = await BacktestsService.getBacktestSpecificationV1CrudBacktestSpecificationsSpecificationIdGet(specification.id);
            const runs = [...benchmark.backtests].sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''));
            saveAs(new Blob([benchmarkCsv(benchmark, runs)], { type: 'text/csv;charset=utf-8' }), `benchmark-${benchmark.id}.csv`);
        },
        onError: () => showDownloadError(),
    });

    const openPage = (path: string) => {
        setOpen(false);
        navigate(path);
    };

    return (
        <OverflowButton
            small
            open={open}
            icon={<IconMore16 />}
            disabled={download.isLoading}
            dataTest={`benchmark-actions-${specification.id}`}
            onClick={() => setOpen(prev => !prev)}
            component={(
                <FlyoutMenu dense>
                    <MenuItem label={i18n.t('View')} icon={<IconView16 />} onClick={() => openPage(detailsPath)} />
                    <MenuItem label={i18n.t('Add models')} icon={<IconAdd16 />} onClick={() => openPage(`${detailsPath}?addModels=true`)} />
                    <MenuItem
                        label={i18n.t('Download CSV')}
                        icon={<IconDownload16 />}
                        disabled={!specification.backtestCount}
                        onClick={() => {
                            setOpen(false);
                            download.mutate();
                        }}
                    />
                    <MenuItem
                        label={i18n.t('New evaluation from this dataset')}
                        icon={<IconDuplicate16 />}
                        onClick={() => openPage(`/evaluate/from-dataset?datasetId=${specification.dataset.id}`)}
                    />
                </FlyoutMenu>
            )}
        />
    );
};
