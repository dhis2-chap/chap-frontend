import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    NoticeBox,
} from '@dhis2/ui';
import { format } from 'date-fns';
import { Tag } from '@dhis2-chap/ui';
import { useAlertPolicies } from '@/hooks/useAlertPolicies';
import { getChapErrorMessage } from '@/utils/chapErrors';
import { describeAlertLevel } from './describeAlertLevel';
import styles from './BackendAlerts.module.css';

export const AlertPoliciesTable = () => {
    const { data: policies, error, isLoading } = useAlertPolicies();

    if (isLoading) return <CircularLoader />;
    if (error) {
        return (
            <NoticeBox error title={i18n.t('Unable to load alert policies')}>
                {getChapErrorMessage(error)}
            </NoticeBox>
        );
    }

    return (
        <DataTable>
            <DataTableHead>
                <DataTableRow>
                    <DataTableColumnHeader>{i18n.t('Name')}</DataTableColumnHeader>
                    <DataTableColumnHeader>{i18n.t('Levels')}</DataTableColumnHeader>
                    <DataTableColumnHeader>{i18n.t('Created')}</DataTableColumnHeader>
                </DataTableRow>
            </DataTableHead>
            <DataTableBody>
                {policies?.length ? policies.map(policy => (
                    <DataTableRow key={policy.id}>
                        <DataTableCell>{policy.name}</DataTableCell>
                        <DataTableCell>
                            <div className={styles.tags}>
                                {policy.levels?.map(level => (
                                    <Tag key={level.name}>{describeAlertLevel(level)}</Tag>
                                ))}
                            </div>
                        </DataTableCell>
                        <DataTableCell>
                            {policy.created ? format(new Date(policy.created), 'dd.MM.yyyy') : '-'}
                        </DataTableCell>
                    </DataTableRow>
                )) : (
                    <DataTableRow>
                        <DataTableCell colSpan="3" align="center">
                            {i18n.t('No alert policies yet.')}
                        </DataTableCell>
                    </DataTableRow>
                )}
            </DataTableBody>
        </DataTable>
    );
};
