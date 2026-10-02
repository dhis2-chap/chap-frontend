import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableFoot,
    DataTableHead,
    DataTableRow,
    Input,
    MenuItem,
    NoticeBox,
    Pagination,
    SingleSelect,
} from '@dhis2/ui';
import { format } from 'date-fns';
import { AlertApproval, AlertsService, Tag, type AlertRead, type ApiError, type TagVariant } from '@dhis2-chap/ui';
import { useAlertPolicies } from '@/hooks/useAlertPolicies';
import { useOrgUnitsById } from '@/hooks/useOrgUnitsById';
import { useTablePaginationParams } from '@/hooks/useTablePaginationParams';
import { getChapErrorMessage } from '@/utils/chapErrors';
import { formatPeriodId } from '@/utils/predictionRunMetadata';
import styles from './BackendAlerts.module.css';

const STATUSES: Record<AlertApproval, { label: () => string; variant: TagVariant }> = {
    [AlertApproval.PENDING]: { label: () => i18n.t('Pending'), variant: 'default' },
    [AlertApproval.APPROVED]: { label: () => i18n.t('Approved'), variant: 'success' },
    [AlertApproval.DECLINED]: { label: () => i18n.t('Declined'), variant: 'destructive' },
};

const isStatus = (value: string | null): value is AlertApproval => (
    !!value && Object.prototype.hasOwnProperty.call(STATUSES, value)
);

export const RecordedAlertsTable = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { pageIndex, pageSize, setPageIndex, setPageSize } = useTablePaginationParams();
    const [search, setSearch] = useState('');
    const predictionId = Number(searchParams.get('predictionId')) || undefined;
    const status = searchParams.get('status');
    const approved = isStatus(status) ? status : undefined;

    const alerts = useQuery<AlertRead[], ApiError>({
        queryKey: ['alerts', predictionId, approved],
        queryFn: () => AlertsService.listAlertsV1CrudAlertsGet(undefined, predictionId, undefined, approved),
        retry: false,
    });
    const { data: policies } = useAlertPolicies();
    const orgUnitIds = useMemo(
        () => [...new Set(alerts.data?.map(alert => alert.orgUnit))].sort(),
        [alerts.data],
    );
    const { data: orgUnits } = useOrgUnitsById(orgUnitIds);

    const setParam = (key: string, value?: string) => setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete('page');
        return next;
    });

    const rows = useMemo(() => {
        const policyName = (id: number) => policies?.find(policy => policy.id === id)?.name ?? String(id);
        const orgUnitName = (id: string) => orgUnits?.organisationUnits.find(ou => ou.id === id)?.displayName ?? id;
        const term = search.trim().toLowerCase();
        return (alerts.data ?? [])
            .map(alert => ({
                ...alert,
                orgUnitName: orgUnitName(alert.orgUnit),
                policyName: policyName(alert.alertPolicyId),
            }))
            .filter(alert => !term || [alert.orgUnitName, alert.level, alert.policyName]
                .some(value => value.toLowerCase().includes(term)))
            .sort((a, b) => b.timePeriod.localeCompare(a.timePeriod) || a.orgUnitName.localeCompare(b.orgUnitName));
    }, [alerts.data, policies, orgUnits, search]);
    const pageRows = rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

    return (
        <div>
            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    <div className={styles.filter}>
                        <Input
                            dense
                            placeholder={i18n.t('Search')}
                            value={search}
                            onChange={({ value }) => {
                                setSearch(value ?? '');
                                setPageIndex(0);
                            }}
                        />
                    </div>
                    <div className={styles.filter}>
                        <SingleSelect
                            dense
                            clearable
                            clearText={i18n.t('Clear')}
                            placeholder={i18n.t('Status')}
                            selected={approved}
                            onChange={({ selected }) => setParam('status', selected)}
                        >
                            {Object.values(AlertApproval).map(value => (
                                <MenuItem key={value} value={value} label={STATUSES[value].label()} />
                            ))}
                        </SingleSelect>
                    </div>
                    {predictionId && (
                        <Tag onRemove={() => setParam('predictionId')}>
                            {i18n.t('Run {{id}}', { id: predictionId })}
                        </Tag>
                    )}
                </div>
            </div>
            {alerts.isLoading && <CircularLoader />}
            {alerts.error && (
                <NoticeBox error title={i18n.t('Unable to load alerts')}>
                    {getChapErrorMessage(alerts.error)}
                </NoticeBox>
            )}
            {alerts.data && (
                <DataTable>
                    <DataTableHead>
                        <DataTableRow>
                            <DataTableColumnHeader>{i18n.t('Period')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Organisation unit')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Level')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Policy')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Run')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Status')}</DataTableColumnHeader>
                            <DataTableColumnHeader>{i18n.t('Recorded')}</DataTableColumnHeader>
                        </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                        {pageRows.length ? pageRows.map((alert) => {
                            const alertStatus = STATUSES[alert.approved ?? AlertApproval.PENDING];
                            return (
                                <DataTableRow key={alert.id}>
                                    <DataTableCell>{formatPeriodId(alert.timePeriod)}</DataTableCell>
                                    <DataTableCell>{alert.orgUnitName}</DataTableCell>
                                    <DataTableCell><Tag variant="warning">{alert.level}</Tag></DataTableCell>
                                    <DataTableCell>{alert.policyName}</DataTableCell>
                                    <DataTableCell>{alert.predictionId ?? '-'}</DataTableCell>
                                    <DataTableCell>
                                        <Tag variant={alertStatus.variant}>{alertStatus.label()}</Tag>
                                    </DataTableCell>
                                    <DataTableCell>
                                        {alert.created ? format(new Date(alert.created), 'dd.MM.yyyy') : '-'}
                                    </DataTableCell>
                                </DataTableRow>
                            );
                        }) : (
                            <DataTableRow>
                                <DataTableCell colSpan="7" align="center">
                                    {alerts.data.length || search || approved || predictionId
                                        ? i18n.t('No alerts match these filters.')
                                        : i18n.t('No alerts have been recorded.')}
                                </DataTableCell>
                            </DataTableRow>
                        )}
                    </DataTableBody>
                    <DataTableFoot>
                        <DataTableRow>
                            <DataTableCell colSpan="7">
                                <Pagination
                                    page={pageIndex + 1}
                                    pageSize={pageSize}
                                    pageCount={Math.max(1, Math.ceil(rows.length / pageSize))}
                                    total={rows.length}
                                    isLastPage={(pageIndex + 1) * pageSize >= rows.length}
                                    onPageChange={(page: number) => setPageIndex(page - 1)}
                                    onPageSizeChange={(size: number) => {
                                        setPageSize(size);
                                        setPageIndex(0);
                                    }}
                                />
                            </DataTableCell>
                        </DataTableRow>
                    </DataTableFoot>
                </DataTable>
            )}
        </div>
    );
};
