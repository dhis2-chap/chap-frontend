import { Input, Checkbox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ConfiguredModelsTableFilters.module.css';
import { useConfiguredModelsTableFilters } from '../hooks/useConfiguredModelsTableFilters';

export const ConfiguredModelsTableFilters = () => {
    const { search, setSearch, includeArchived, setIncludeArchived } = useConfiguredModelsTableFilters();

    const handleSearchChange = (value: string | undefined) => {
        const searchValue = value || undefined;
        setSearch(searchValue);
    };

    return (
        <div className={styles.container}>
            <div className={styles.inputContainer}>
                <Input
                    dense
                    placeholder={i18n.t('Search')}
                    value={search}
                    onChange={e => handleSearchChange(e.value)}
                />
            </div>
            <Checkbox
                dense
                label={i18n.t('Include archived')}
                checked={includeArchived}
                onChange={({ checked }) => setIncludeArchived(checked)}
            />
        </div>
    );
};
