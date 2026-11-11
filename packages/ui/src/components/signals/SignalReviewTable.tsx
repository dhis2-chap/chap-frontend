import i18n from '@dhis2/d2-i18n';
import {
    Button,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    Tag,
} from '@dhis2/ui';
import { AlertApproval } from '../../httpfunctions/models/AlertApproval';
import type { AlertRead } from '../../httpfunctions/models/AlertRead';

export type SignalReviewTableProps = {
    alerts: AlertRead[];
    orgUnitNames: ReadonlyMap<string, string>;
    formatPeriod: (period: string) => string;
    onApprove: (alertId: number) => void;
    approvingId?: number;
    disabled?: boolean;
};

// Data, identity and persistence belong to the host app, so this view can also be used in a Chap block.
export const SignalReviewTable = ({
    alerts,
    orgUnitNames,
    formatPeriod,
    onApprove,
    approvingId,
    disabled,
}: SignalReviewTableProps) => (
    <DataTable scrollWidth="100%">
        <DataTableHead>
            <DataTableRow>
                <DataTableColumnHeader>{i18n.t('Organisation unit')}</DataTableColumnHeader>
                <DataTableColumnHeader>{i18n.t('Period')}</DataTableColumnHeader>
                <DataTableColumnHeader>{i18n.t('Signal level')}</DataTableColumnHeader>
                <DataTableColumnHeader>{i18n.t('Status')}</DataTableColumnHeader>
                <DataTableColumnHeader>{i18n.t('Reviewed by')}</DataTableColumnHeader>
                <DataTableColumnHeader>{i18n.t('Actions')}</DataTableColumnHeader>
            </DataTableRow>
        </DataTableHead>
        <DataTableBody>
            {alerts.map((alert) => {
                // Older alerts without a review state are pending in Chap.
                const status = alert.approved ?? AlertApproval.PENDING;
                return (
                    <DataTableRow key={alert.id} dataTest={`signal-review-${alert.id}`}>
                        <DataTableCell>{orgUnitNames.get(alert.orgUnit) ?? alert.orgUnit}</DataTableCell>
                        <DataTableCell>{formatPeriod(alert.timePeriod)}</DataTableCell>
                        <DataTableCell>{alert.level}</DataTableCell>
                        <DataTableCell>
                            <Tag
                                positive={status === AlertApproval.APPROVED}
                                negative={status === AlertApproval.DECLINED}
                                neutral={status === AlertApproval.PENDING}
                            >
                                {status === AlertApproval.APPROVED
                                    ? i18n.t('Approved')
                                    : status === AlertApproval.DECLINED ? i18n.t('Declined') : i18n.t('Pending')}
                            </Tag>
                        </DataTableCell>
                        <DataTableCell>{alert.approvedBy ?? '–'}</DataTableCell>
                        <DataTableCell>
                            {status === AlertApproval.PENDING && (
                                <Button
                                    small
                                    disabled={disabled || approvingId !== undefined}
                                    loading={approvingId === alert.id}
                                    onClick={() => onApprove(alert.id)}
                                >
                                    {i18n.t('Approve')}
                                </Button>
                            )}
                        </DataTableCell>
                    </DataTableRow>
                );
            })}
        </DataTableBody>
    </DataTable>
);
