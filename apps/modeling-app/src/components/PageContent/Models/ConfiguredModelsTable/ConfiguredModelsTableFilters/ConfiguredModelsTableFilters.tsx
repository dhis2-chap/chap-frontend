import { Checkbox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ConfiguredModelsTableFilters.module.css';
import { useConfiguredModelsTableFilters } from '../hooks/useConfiguredModelsTableFilters';
import { TableSearchFilter } from '../../../../TableSearchFilter';

export const ConfiguredModelsTableFilters = () => {
    const { search, setSearch, includeArchived, setIncludeArchived } = useConfiguredModelsTableFilters();

    return (
        <div className={styles.container}>
            <TableSearchFilter
                search={search}
                onSearchChange={setSearch}
            />
            <Checkbox
                dense
                label={i18n.t('Include archived')}
                checked={includeArchived}
                onChange={({ checked }) => setIncludeArchived(checked)}
            />
        </div>
    );
};
