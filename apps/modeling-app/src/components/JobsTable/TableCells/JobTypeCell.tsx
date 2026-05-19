import { getJobTypeLabel } from '../jobTypeLabels';

type JobTypeCellProps = {
    jobType: string;
};

export const JobTypeCell = ({ jobType }: JobTypeCellProps) => {
    return <>{getJobTypeLabel(jobType)}</>;
};
