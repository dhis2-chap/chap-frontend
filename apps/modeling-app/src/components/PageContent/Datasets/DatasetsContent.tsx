import i18n from '@dhis2/d2-i18n';
import { Card } from '@dhis2-chap/ui';
import { CircularLoader } from '@dhis2/ui';
import { DatasetsTable } from './DatasetsTable';
import { useDatasets } from '../../../hooks/useDatasets';
import { ChapErrorNotice } from '../../ChapErrorNotice';
import styles from './DatasetsContent.module.css';

export const DatasetsContent = () => {
    const { data: datasets, error, isLoading } = useDatasets();

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <ChapErrorNotice error={error} title={i18n.t('Error loading datasets')} />
            </div>
        );
    }

    return (
        <Card className={styles.container}>
            <DatasetsTable datasets={datasets ?? []} />
        </Card>
    );
};
