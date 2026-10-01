import i18n from '@dhis2/d2-i18n';
import { useBacktestSpecification } from './useBacktestSpecification';

export const BenchmarkBreadcrumb = ({ specificationId }: { specificationId: number }) => {
    const { data } = useBacktestSpecification(specificationId);
    return <>{data?.dataset.name ?? i18n.t('Benchmark {{id}}', { id: `#${specificationId}` })}</>;
};
