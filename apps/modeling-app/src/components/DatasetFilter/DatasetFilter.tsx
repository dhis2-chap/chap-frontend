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
    const options = [...new Map(datasets.map(dataset => [dataset.id, dataset])).values()]
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className={styles.singleSelectContainer}>
            <SingleSelect
                dataTest="dataset-filter"
                filterable
                noMatchText={i18n.t('No datasets found')}
                dense
                clearable
                clearText={i18n.t('Clear')}
                selected={datasetId}
                placeholder={i18n.t('Dataset')}
                onChange={({ selected }) => setDatasetId(selected)}
            >
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
