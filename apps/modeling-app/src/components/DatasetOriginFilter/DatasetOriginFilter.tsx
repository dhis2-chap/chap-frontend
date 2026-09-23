import { MenuItem, SingleSelect } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { DataSetInfo } from '@dhis2-chap/ui';
import { DatasetOrigin, useDatasetOriginFilter } from './useDatasetOriginFilter';
import styles from './DatasetOriginFilter.module.css';

type Props = {
    datasets: DataSetInfo[];
    dense?: boolean;
};

export const DatasetOriginFilter = ({ datasets, dense = true }: Props) => {
    const { origin, setOrigin } = useDatasetOriginFilter();

    if (!datasets.some(dataset => dataset.createdManually != null)) {
        return null;
    }

    return (
        <div className={styles.singleSelectContainer}>
            <SingleSelect
                dense={dense}
                clearable
                clearText={i18n.t('Clear')}
                selected={origin}
                placeholder={i18n.t('Origin')}
                onChange={({ selected }) => setOrigin(selected as DatasetOrigin | undefined)}
            >
                <MenuItem label={i18n.t('Created manually')} value="manual" />
                <MenuItem label={i18n.t('Created by evaluations or predictions')} value="generated" />
            </SingleSelect>
        </div>
    );
};
