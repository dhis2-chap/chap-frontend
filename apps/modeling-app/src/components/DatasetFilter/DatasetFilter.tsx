import { MenuItem, SingleSelect } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { DataSetMeta } from '@dhis2-chap/ui';
import { useDatasetFilter } from './useDatasetFilter';
import styles from '../BacktestsTable/BacktestsTableFilters/BacktestsTableFilters.module.css';

type Props = {
    datasets: DataSetMeta[];
};

export const DatasetFilter = ({ datasets }: Props) => {
    const { datasetId, setDatasetId } = useDatasetFilter();
    // Offer manually created datasets, plus any dataset selected through a deep link.
    const manualDatasets = datasets.filter(dataset => dataset.createdManually !== false || String(dataset.id) === datasetId);
    const options = [...new Map(manualDatasets.map(dataset => [dataset.id, dataset])).values()]
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className={styles.singleSelectContainer}>
            <SingleSelect
                dataTest="dataset-filter"
                filterable
                noMatchText={i18n.t('No datasets found')}
                empty={i18n.t('No manually created datasets')}
                dense
                clearable
                clearText={i18n.t('Clear')}
                selected={datasetId}
                placeholder={i18n.t('Dataset')}
                onChange={({ selected }) => setDatasetId(selected)}
            >
                {datasetId && !options.some(dataset => String(dataset.id) === datasetId) && (
                    <MenuItem label={i18n.t('Dataset {{id}}', { id: `#${datasetId}` })} value={datasetId} />
                )}
                {options.map(dataset => (
                    <MenuItem
                        key={dataset.id}
                        className={styles.singleSelectMenuItem}
                        label={dataset.name}
                        value={dataset.id.toString()}
                    />
                ))}
            </SingleSelect>
        </div>
    );
};
