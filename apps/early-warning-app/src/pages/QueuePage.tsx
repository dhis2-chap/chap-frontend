import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, DataTable, DataTableHead, DataTableBody, DataTableRow, DataTableCell, DataTableColumnHeader, NoticeBox } from '@dhis2/ui';
import { Link } from 'react-router-dom';
import { Widget } from '@dhis2-chap/ui';
import { usePredictionReviews } from '../hooks/usePredictionReviews';

export const QueuePage = () => {
    const { reviews, isLoading, error, refetch } = usePredictionReviews();
    const pending = reviews.filter(review => review.pending > 0);
    return (
        <>
            <h1>{i18n.t('Review queue')}</h1>
            <Button small onClick={() => void refetch()} disabled={isLoading}>{i18n.t('Refresh')}</Button>
            {isLoading ? <CircularLoader /> : error ? (
                <NoticeBox error title={i18n.t('Unable to load predictions awaiting review')}>
                    {error instanceof Error ? error.message : i18n.t('Please try again.')}
                </NoticeBox>
            ) : pending.length === 0 ? (
                <NoticeBox title={i18n.t('No predictions awaiting review')}>
                    {i18n.t('Predictions appear here when CHAP raises pending alerts.')}
                </NoticeBox>
            ) : (
                <Widget header={i18n.t('Predictions awaiting review')} noncollapsible>
                    <DataTable>
                        <DataTableHead>
                            <DataTableRow>
                                <DataTableColumnHeader>{i18n.t('Prediction')}</DataTableColumnHeader>
                                <DataTableColumnHeader>{i18n.t('Model')}</DataTableColumnHeader>
                                <DataTableColumnHeader>{i18n.t('Created')}</DataTableColumnHeader>
                                <DataTableColumnHeader>{i18n.t('Pending alerts by level')}</DataTableColumnHeader>
                            </DataTableRow>
                        </DataTableHead>
                        <DataTableBody>
                            {pending.map(({ prediction, pendingLevelCounts }) => (
                                <DataTableRow key={prediction.id}>
                                    <DataTableCell><Link to={`/predictions/${prediction.id}`}>{prediction.name}</Link></DataTableCell>
                                    <DataTableCell>{prediction.configuredModel?.name ?? prediction.modelId}</DataTableCell>
                                    <DataTableCell>{new Date(prediction.created).toLocaleString()}</DataTableCell>
                                    <DataTableCell>{Object.entries(pendingLevelCounts).map(([level, count]) => `${level}: ${count}`).join(', ')}</DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </Widget>
            )}
        </>
    );
};
