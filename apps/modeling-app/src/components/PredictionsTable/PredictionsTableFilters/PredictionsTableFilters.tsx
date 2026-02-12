import {
    Input,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './PredictionsTableFilters.module.css';
import { usePredictionsTableFilters } from '../hooks/usePredictionsTableFilters';

export const PredictionsTableFilters = () => {
    const { search, setSearch } = usePredictionsTableFilters();

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
