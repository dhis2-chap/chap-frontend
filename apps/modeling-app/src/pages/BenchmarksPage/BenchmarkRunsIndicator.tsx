import i18n from '@dhis2/d2-i18n';
import { Tooltip } from '@dhis2/ui';
import { StatusIndicator } from '@dhis2-chap/ui';
import { useModels } from '../../hooks/useModels';
import { SpecificationParams, getJobModelName, requestMatchesSpecification } from './benchmarkUtils';
import { RunningBenchmarkJob } from './useRunningBenchmarkJobs';

type Props = {
    specification: SpecificationParams;
    runningJobs: RunningBenchmarkJob[];
};

export const BenchmarkRunsIndicator = ({ specification, runningJobs }: Props) => {
    const { models } = useModels({ includeArchived: true });
    const jobs = runningJobs.filter(({ request }) => requestMatchesSpecification(request, specification));
    if (!jobs.length) return null;

    const count = jobs.length;
    const modelNames = jobs.map(({ job }) => {
        const name = getJobModelName(job.name);
        return models?.find(model => model.name === name)?.displayName || name;
    });
    return (
        <Tooltip content={modelNames.join(', ')}>
            <StatusIndicator
                variant="info"
                active
                label={i18n.t('{{count}} models running', { count, defaultValue: '{{count}} model running', defaultValue_plural: '{{count}} models running' })}
            />
        </Tooltip>
    );
};
