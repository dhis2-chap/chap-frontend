import i18n from '@dhis2/d2-i18n';
import { DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow, NoticeBox } from '@dhis2/ui';
import { Card, Pill } from '@dhis2-chap/ui';
import { format } from 'date-fns';
import { PageHeader } from '../components/PageHeader';
import { ErrorNotice, Loading } from '../components/StateViews';
import { usePredictionReviews } from '../hooks/usePredictionReviews';
import styles from './QueuePage.module.css';

export const QueuePage = () => {
    const { reviews, isLoading, error } = usePredictionReviews();

    const content = () => {
        if (isLoading) return <Loading />;
        if (error) return <ErrorNotice error={error} />;
        if (reviews.length === 0) {
            return (
                <NoticeBox title={i18n.t('No predictions awaiting review')}>
                    {i18n.t('Predictions appear here when CHAP raises pending alerts.')}
                </NoticeBox>
            );
        }
        return (
            <Card className={styles.card}>
                <DataTable>
                    <DataTableHead>
                        <DataTableRow>
                            <DataTableColumnHeader>{i18n.t('Prediction')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Model')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Created')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Pending alerts')}</DataTableColumnHeader>
                        </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                        {reviews.map(({ prediction, levelCounts }) => (
                            <DataTableRow key={prediction.id}>
                                <DataTableCell>
                                    <span className={styles.strong}>{prediction.name}</span>
                                    <span className={styles.muted}>{i18n.t('Prediction {{id}}', { id: `#${prediction.id}` })}</span>
                                </DataTableCell>
                                <DataTableCell>{prediction.configuredModel?.name ?? prediction.modelId}</DataTableCell>
                                <DataTableCell className={styles.nowrap}>{format(new Date(prediction.created), 'dd.MM.yyyy, HH:mm')}</DataTableCell>
                                <DataTableCell>
                                    <div className={styles.levels}>
                                        {levelCounts.map(({ level, count }) => (
                                            <Pill key={level}>{`${level} ${count}`}</Pill>
                                        ))}
                                    </div>
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </Card>
        );
    };

    return (
        <>
            <PageHeader title={i18n.t('Review queue')}>
                <p className={styles.description}>{i18n.t('Predictions with alerts that have not been reviewed yet, newest first.')}</p>
            </PageHeader>
            {content()}
        </>
    );
};
