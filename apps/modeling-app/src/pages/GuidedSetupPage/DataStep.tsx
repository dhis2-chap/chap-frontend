import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import type { DataSetInfo } from '@dhis2-chap/ui';
import { NewDatasetForm } from '../../components/NewDatasetForm';
import styles from './GuidedSetupPage.module.css';

type Props = {
    /** Datasets the user imported, newest first. */
    datasets: DataSetInfo[];
    selected?: DataSetInfo;
    onSelect: (datasetId: number) => void;
};

export const DataStep = ({ datasets, selected, onSelect }: Props) => {
    const [isImporting, setIsImporting] = useState(false);

    if (isImporting) {
        return (
            <>
                <Button small onClick={() => setIsImporting(false)}>{i18n.t('Cancel import')}</Button>
                <div className={styles.inset}>
                    <NewDatasetForm onCreated={onSelect} prefillColumns />
                </div>
            </>
        );
    }

    return (
        <>
            {datasets.length > 0 && (
                <SingleSelectField
                    className={styles.datasetField}
                    label={i18n.t('Data you have imported')}
                    placeholder={i18n.t('Choose a dataset')}
                    selected={selected?.id != null ? String(selected.id) : ''}
                    filterable
                    dataTest="guided-dataset-select"
                    onChange={({ selected: id }) => onSelect(Number(id))}
                >
                    {datasets.map(dataset => (
                        <SingleSelectOption key={dataset.id} value={String(dataset.id)} label={dataset.name} />
                    ))}
                </SingleSelectField>
            )}
            <Button primary={!datasets.length} onClick={() => setIsImporting(true)} dataTest="guided-import-data">
                {datasets.length ? i18n.t('Import new data') : i18n.t('Import data from DHIS2')}
            </Button>
        </>
    );
};
