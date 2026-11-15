import { SearchField } from '@chap-blocks/ui/search';
import i18n from '@dhis2/d2-i18n';
import styles from './ReadyToPredictTableFilters.module.css';
import { useReadyToPredictTableFilters } from '../hooks/useReadyToPredictTableFilters';

export const ReadyToPredictTableFilters = () => {
    const { search, setSearch } = useReadyToPredictTableFilters();

    return (
        <div className={styles.inputContainer}>
            <SearchField
                label={i18n.t('Search prediction setups')}
                placeholder={i18n.t('Search')}
                value={search ?? ''}
                onChange={value => setSearch(value || undefined)}
            />
        </div>
    );
};
