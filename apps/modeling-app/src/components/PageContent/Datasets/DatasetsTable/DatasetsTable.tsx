import i18n from '@dhis2/d2-i18n';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
} from '@dhis2/ui';
import { Link } from 'react-router-dom';
import { DataSetInfo, Tag } from '@dhis2-chap/ui';
import styles from './DatasetsTable.module.css';

type Props = {
    datasets: DataSetInfo[];
};

export const DatasetsTable = ({ datasets }: Props) => (
    <DataTable>
        <DataTableHead>
            <DataTableRow>
                <DataTableColumnHeader>{i18n.t('Name')}</DataTableColumnHeader>
                <DataTableColumnHeader>{i18n.t('Period range')}</DataTableColumnHeader>
                <DataTableColumnHeader>{i18n.t('Covariates')}</DataTableColumnHeader>
                <DataTableColumnHeader>{i18n.t('Organisation units')}</DataTableColumnHeader>
                <DataTableColumnHeader />
            </DataTableRow>
        </DataTableHead>
        <DataTableBody>
            {datasets.map(dataset => (
                <DataTableRow key={dataset.id}>
                    <DataTableCell>{dataset.name}</DataTableCell>
                    <DataTableCell>
                        {dataset.firstPeriod && dataset.lastPeriod
                            ? `${dataset.firstPeriod} – ${dataset.lastPeriod}`
                            : undefined}
                    </DataTableCell>
                    <DataTableCell>
                        <div className={styles.covariates}>
                            {dataset.covariates?.map(covariate => (
                                <Tag key={covariate}>{covariate}</Tag>
                            ))}
                        </div>
                    </DataTableCell>
                    <DataTableCell>{dataset.orgUnits?.length}</DataTableCell>
                    <DataTableCell>
                        {dataset.id != null && (
                            <Link to={`/evaluate/from-dataset?datasetId=${dataset.id}`}>
                                {i18n.t('Create evaluation')}
                            </Link>
                        )}
                    </DataTableCell>
                </DataTableRow>
            ))}
        </DataTableBody>
    </DataTable>
);
