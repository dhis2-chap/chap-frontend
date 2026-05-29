import { Input } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './ReadyToPredictTableFilters.module.css';
import { useReadyToPredictTableFilters } from '../hooks/useReadyToPredictTableFilters';

export const ReadyToPredictTableFilters = () => {
    const { search, setSearch } = useReadyToPredictTableFilters();

    return (
        <div className={styles.inputContainer}>
            <Input
                dense
                placeholder={i18n.t('Search')}
                value={search}
                onChange={e => setSearch(e.value || undefined)}
            />
        </div>
    );
};
