import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow, NoticeBox } from '@dhis2/ui';
import { Link } from 'react-router-dom';
import { Widget } from '@dhis2-chap/ui';
import { usePredictionReviews } from '../hooks/usePredictionReviews';

export const HistoryPage = () => {
    const { reviews, isLoading, error, refetch } = usePredictionReviews();
    const reviewed = reviews.filter(review => review.accepted + review.declined > 0)
        .sort((a, b) => (b.lastReviewedAt ?? '').localeCompare(a.lastReviewedAt ?? ''));
    return (
        <>
            <h1>{i18n.t('Review history')}</h1>
            <Button small onClick={() => void refetch()} disabled={isLoading}>{i18n.t('Refresh')}</Button>
            {isLoading ? <CircularLoader /> : error ? <NoticeBox error title={i18n.t('Unable to load review history')}>{error instanceof Error ? error.message : i18n.t('Please try again.')}</NoticeBox>
                : reviewed.length === 0 ? <NoticeBox>{i18n.t('No predictions have been reviewed yet.')}</NoticeBox>
                    : (
                            <Widget header={i18n.t('Reviewed predictions')} noncollapsible>
                                <DataTable>
                                    <DataTableHead>
                                        <DataTableRow>
                                            <DataTableColumnHeader>{i18n.t('Prediction')}</DataTableColumnHeader>
                                            <DataTableColumnHeader>{i18n.t('Accepted')}</DataTableColumnHeader>
                                            <DataTableColumnHeader>{i18n.t('Declined')}</DataTableColumnHeader>
                                            <DataTableColumnHeader>{i18n.t('Pending')}</DataTableColumnHeader>
                                            <DataTableColumnHeader>{i18n.t('Reviewers')}</DataTableColumnHeader>
                                            <DataTableColumnHeader>{i18n.t('Latest review')}</DataTableColumnHeader>
                                        </DataTableRow>
                                    </DataTableHead>
                                    <DataTableBody>
                                        {reviewed.map(review => (
                                            <DataTableRow key={review.prediction.id}>
                                                <DataTableCell><Link to={`/predictions/${review.prediction.id}`}>{review.prediction.name}</Link></DataTableCell>
                                                <DataTableCell>{review.accepted}</DataTableCell>
                                                <DataTableCell>{review.declined}</DataTableCell>
                                                <DataTableCell>{review.pending}</DataTableCell>
                                                <DataTableCell>{review.reviewers.join(', ') || i18n.t('Unknown')}</DataTableCell>
                                                <DataTableCell>{review.lastReviewedAt ? new Date(review.lastReviewedAt).toLocaleString() : i18n.t('Unknown')}</DataTableCell>
                                            </DataTableRow>
                                        ))}
                                    </DataTableBody>
                                </DataTable>
                            </Widget>
                        )}
        </>
    );
};
