import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, Table, TableHead, TableBody, TableRow, TableCell, TableCellHead } from '@dhis2/ui';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/features/common-features/PageHeader/PageHeader';
import { useDatasets } from '@/hooks/useDatasets';
import { CreateDataset } from '@/components/CreateDataset/CreateDataset';

export const CreateDatasetPage = () => (
    <div>
        <PageHeader pageTitle={i18n.t('Create dataset')} pageDescription={i18n.t('Choose data and name its columns to reuse the dataset across models.')} />
        <Link to="/datasets">{i18n.t('Back to datasets')}</Link>
        <CreateDataset />
    </div>
);

export const DatasetsPage = () => {
    const datasets = useDatasets();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    return (
        <div>
            <PageHeader pageTitle={i18n.t('Datasets')} pageDescription={i18n.t('Datasets can be reused across model evaluations.')} />
            <Button primary onClick={() => navigate('/datasets/new')}>{i18n.t('Create dataset')}</Button>
            {params.get('created') && <NoticeBox title={i18n.t('Dataset created')} />}
            {datasets.isLoading && <CircularLoader />}
            {!!datasets.error && <NoticeBox error>{i18n.t('Could not load datasets')}</NoticeBox>}
            {datasets.data?.length === 0 && <p>{i18n.t('No datasets yet')}</p>}
            {!!datasets.data?.length && (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCellHead>{i18n.t('Name')}</TableCellHead>
                            <TableCellHead>{i18n.t('Period range')}</TableCellHead>
                            <TableCellHead>{i18n.t('Covariates')}</TableCellHead>
                            <TableCellHead>{i18n.t('DHIS2 data sources')}</TableCellHead>
                            <TableCellHead>{i18n.t('Actions')}</TableCellHead>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {datasets.data.map(dataset => (
                            <TableRow key={dataset.id}>
                                <TableCell>{dataset.name}</TableCell>
                                <TableCell>
                                    {dataset.firstPeriod}
                                    {' '}
                                    –
                                    {' '}
                                    {dataset.lastPeriod}
                                </TableCell>
                                <TableCell>{dataset.covariates?.join(', ')}</TableCell>
                                <TableCell>
                                    {dataset.dataSources?.map(source => (
                                        <div key={source.covariate}>
                                            {source.covariate}
                                            {' '}
                                            →
                                            {' '}
                                            {source.dataElementId}
                                        </div>
                                    ))}
                                </TableCell>
                                <TableCell>{dataset.id != null && <Link to={`/evaluate/from-dataset?datasetId=${dataset.id}`}>{i18n.t('Create evaluation')}</Link>}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
};
