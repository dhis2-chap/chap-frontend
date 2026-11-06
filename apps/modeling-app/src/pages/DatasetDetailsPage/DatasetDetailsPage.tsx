import i18n from '@dhis2/d2-i18n';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { DatasetDetails } from '../../components/PageContent/DatasetDetails/DatasetDetails';
import { useDataset } from '../../hooks/useDataset';

export const DatasetDetailsPage: React.FC = () => {
    const { datasetId } = useParams();
    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Dataset')}
                pageDescription={i18n.t('Review the saved data and where values are missing.')}
                guideSlug="creating-a-dataset"
            />
            <DatasetDetails datasetId={Number(datasetId)} />
        </>
    );
};

export const DatasetBreadcrumb = ({ datasetId }: { datasetId: number }) => {
    const { data } = useDataset(datasetId);
    return <>{data?.name ?? i18n.t('Dataset {{id}}', { id: `#${datasetId}` })}</>;
};
