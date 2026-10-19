import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow, NoticeBox } from '@dhis2/ui';
import { AlertApproval, getPeriodNameFromId, Widget } from '@dhis2-chap/ui';
import { usePredictionAlerts } from '@/hooks/usePredictionAlerts';
import { useOrgUnitsById } from '@/hooks/useOrgUnitsById';
import { AlertLevelTag } from './AlertLevelTag';
import styles from './BackendAlerts.module.css';

const approvalLabels = {
    [AlertApproval.PENDING]: i18n.t('Pending'),
    [AlertApproval.APPROVED]: i18n.t('Approved'),
    [AlertApproval.DECLINED]: i18n.t('Declined'),
};

export const PredictionRunAlerts = ({ predictionId }: { predictionId: number }) => {
    const { displayedAlerts, isLoading, error, displayError, refetch } = usePredictionAlerts(predictionId);
    const orgUnits = useOrgUnitsById([...new Set(displayedAlerts.map(alert => alert.orgUnit))]);
    const names = new Map(orgUnits.data?.organisationUnits?.map(orgUnit => [orgUnit.id, orgUnit.displayName]));
    return (
        <Widget noncollapsible header={i18n.t('Raised alerts')}>
            {isLoading ? <CircularLoader small /> : error ? (
                <NoticeBox error title={i18n.t('Unable to load raised alerts')}>
                    <Button small onClick={() => refetch()}>{i18n.t('Retry')}</Button>
                </NoticeBox>
            ) : (
                <>
                    {displayError && (
                        <NoticeBox warning title={i18n.t('Saved labels and colours could not be loaded')}>
                            {i18n.t('Alerts are shown with their original labels and default colours.')}
                        </NoticeBox>
                    )}
                    {displayedAlerts.length === 0 ? <p>{i18n.t('No alerts were raised for this prediction.')}</p> : (
                        <div className={styles.alertTable}>
                            <DataTable dataTest="prediction-raised-alerts">
                                <DataTableHead>
                                    <DataTableRow>
                                        <DataTableColumnHeader>{i18n.t('Region')}</DataTableColumnHeader>
                                        <DataTableColumnHeader>{i18n.t('Period')}</DataTableColumnHeader>
                                        <DataTableColumnHeader>{i18n.t('Alert level')}</DataTableColumnHeader>
                                        <DataTableColumnHeader>{i18n.t('Policy')}</DataTableColumnHeader>
                                        <DataTableColumnHeader>{i18n.t('Review status')}</DataTableColumnHeader>
                                    </DataTableRow>
                                </DataTableHead>
                                <DataTableBody>
                                    {displayedAlerts.map(alert => (
                                        <DataTableRow key={alert.id}>
                                            <DataTableCell>{names.get(alert.orgUnit) ?? alert.orgUnit}</DataTableCell>
                                            <DataTableCell>{getPeriodNameFromId(alert.timePeriod)}</DataTableCell>
                                            <DataTableCell><AlertLevelTag display={alert.display} /></DataTableCell>
                                            <DataTableCell>{alert.policyName}</DataTableCell>
                                            <DataTableCell>{alert.approved ? approvalLabels[alert.approved] : '-'}</DataTableCell>
                                        </DataTableRow>
                                    ))}
                                </DataTableBody>
                            </DataTable>
                        </div>
                    )}
                </>
            )}
        </Widget>
    );
};
