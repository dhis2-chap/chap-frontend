import i18n from '@dhis2/d2-i18n';
import { DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow, NoticeBox } from '@dhis2/ui';
import { Card, Pill } from '@dhis2-chap/ui';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { ErrorNotice, Loading } from '../components/StateViews';
import { usePendingPredictionAlerts } from '../hooks/usePredictionReviews';
import { useOrgUnitNames } from '../hooks/useOrgUnitNames';
import { severity } from '../utils/reviewData';
import styles from './ReviewPages.module.css';

export const PredictionPage = () => {
    const { predictionId } = useParams();
    const { prediction, alerts, policies, isLoading, error } = usePendingPredictionAlerts(Number(predictionId));
    const orgUnitNames = useOrgUnitNames(alerts.map(alert => alert.orgUnit));
    const orgUnitName = (id: string) => orgUnitNames.get(id) ?? id;

    if (isLoading) return <Loading />;
    if (error) return <ErrorNotice error={error} />;
    if (!prediction) return <NoticeBox error title={i18n.t('Prediction not found')} />;

    // Most severe first, then by location and period.
    const sorted = [...alerts].sort((a, b) => severity(b, policies) - severity(a, policies)
        || orgUnitName(a.orgUnit).localeCompare(orgUnitName(b.orgUnit))
        || a.timePeriod.localeCompare(b.timePeriod));

    return (
        <>
            <Link className={styles.back} to="/review-queue">{i18n.t('Back to review queue')}</Link>
            <PageHeader title={prediction.name}>
                <p className={styles.description}>
                    {i18n.t('Pending alerts from {{model}}. Reviewing alerts will be added here.', {
                        model: prediction.configuredModel?.name ?? prediction.modelId,
                    })}
                </p>
            </PageHeader>
            {sorted.length === 0 ? (
                <NoticeBox title={i18n.t('No pending alerts')}>
                    {i18n.t('All alerts from this prediction have been reviewed.')}
                </NoticeBox>
            ) : (
                <Card className={styles.card}>
                    <DataTable>
                        <DataTableHead>
                            <DataTableRow>
                                <DataTableColumnHeader>{i18n.t('Location')}</DataTableColumnHeader>
                                <DataTableColumnHeader>{i18n.t('Period')}</DataTableColumnHeader>
                                <DataTableColumnHeader>{i18n.t('Level')}</DataTableColumnHeader>
                            </DataTableRow>
                        </DataTableHead>
                        <DataTableBody>
                            {sorted.map(alert => (
                                <DataTableRow key={alert.id}>
                                    <DataTableCell>{orgUnitName(alert.orgUnit)}</DataTableCell>
                                    <DataTableCell>{alert.timePeriod}</DataTableCell>
                                    <DataTableCell><Pill>{alert.level}</Pill></DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </Card>
            )}
        </>
    );
};
