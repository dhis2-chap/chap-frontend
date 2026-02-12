import {
    Input,
    SingleSelect,
    MenuItem,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { ModelSpecRead } from '@dhis2-chap/ui';
import styles from './BacktestsTableFilters.module.css';
import { useBacktestsTableFilters } from '../hooks/useBacktestsTableFilters';

type Props = {
    models: ModelSpecRead[];
};

export const BacktestsTableFilters = ({ models }: Props) => {
    const { modelId, setModelId, search, setSearch } = useBacktestsTableFilters();

    const handleSearchChange = (value: string | undefined) => {
        const searchValue = value || undefined;
        setSearch(searchValue);
    };

    const handleModelChange = (selected: string | undefined) => {
        setModelId(selected);
    };

    return (
        <>
            <div className={styles.inputContainer}>
                <Input
                    dense
                    placeholder={i18n.t('Search')}
                    value={search}
                    onChange={e => handleSearchChange(e.value)}
                />
            </div>

            <div className={styles.singleSelectContainer}>
                <SingleSelect
                    filterable
                    noMatchText={i18n.t('No models found')}
                    dense
                    clearable
                    clearText={i18n.t('Clear')}
                    selected={modelId}
                    placeholder={i18n.t('Model')}
                    onChange={e => handleModelChange(e.selected)}
                >
                    {models.map(model => (
                        <MenuItem
                            key={model.id}
                            className={styles.singleSelectMenuItem}
                            label={model.displayName ?? model.name}
                            value={model.id.toString()}
                        />
                    ))}
                </SingleSelect>
            </div>
        </>
    );
};
