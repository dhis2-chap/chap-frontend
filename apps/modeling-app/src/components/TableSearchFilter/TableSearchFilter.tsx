import { Input } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './TableSearchFilter.module.css';

type Props = {
    search: string;
    onSearchChange: (value: string | undefined) => void;
    placeholder?: string;
};

export const TableSearchFilter = ({ search, onSearchChange, placeholder }: Props) => {
    const handleSearchChange = (value: string | undefined) => {
        const searchValue = value || undefined;
        onSearchChange(searchValue);
    };

    return (
        <div className={styles.inputContainer}>
            <Input
                dense
                placeholder={placeholder ?? i18n.t('Search')}
                value={search}
                onChange={e => handleSearchChange(e.value)}
            />
        </div>
    );
};
