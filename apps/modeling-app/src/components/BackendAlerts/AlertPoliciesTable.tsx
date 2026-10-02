import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    IconAdd16,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui';
import { format } from 'date-fns';
import { Tag, type AlertPolicyRead } from '@dhis2-chap/ui';
import { useAlertPolicies, useDeleteAlertPolicy } from '@/hooks/useAlertPolicies';
import { getChapErrorMessage } from '@/utils/chapErrors';
import { TableActionButton } from '../TableActionButton';
import { CreateAlertPolicyModal } from './CreateAlertPolicyModal';
import { describeAlertLevel } from './describeAlertLevel';
import styles from './BackendAlerts.module.css';

const DeleteAlertPolicyModal = ({ policy, onClose }: { policy: AlertPolicyRead; onClose: () => void }) => {
    const deletePolicy = useDeleteAlertPolicy();
    return (
        <Modal small onClose={onClose}>
            <ModalTitle>{i18n.t('Delete alert policy')}</ModalTitle>
            <ModalContent>
                <p>{i18n.t('Delete "{{name}}"? This cannot be undone.', { name: policy.name })}</p>
                {deletePolicy.error && (
                    <NoticeBox error title={i18n.t('Unable to delete alert policy')}>
                        {getChapErrorMessage(deletePolicy.error)}
                    </NoticeBox>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} disabled={deletePolicy.isLoading}>{i18n.t('Cancel')}</Button>
                    <Button
                        destructive
                        loading={deletePolicy.isLoading}
                        onClick={() => deletePolicy.mutate(policy.id, { onSuccess: onClose })}
                    >
                        {i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};

export const AlertPoliciesTable = () => {
    const { data: policies, error, isLoading } = useAlertPolicies();
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<AlertPolicyRead>();

    if (isLoading) return <CircularLoader />;
    if (error) {
        return (
            <NoticeBox error title={i18n.t('Unable to load alert policies')}>
                {getChapErrorMessage(error)}
            </NoticeBox>
        );
    }

    return (
        <div>
            <div className={styles.toolbar}>
                <span />
                <Button primary small icon={<IconAdd16 />} onClick={() => setCreating(true)}>
                    {i18n.t('New policy')}
                </Button>
            </div>
            <DataTable>
                <DataTableHead>
                    <DataTableRow>
                        <DataTableColumnHeader>{i18n.t('Name')}</DataTableColumnHeader>
                        <DataTableColumnHeader>{i18n.t('Levels')}</DataTableColumnHeader>
                        <DataTableColumnHeader>{i18n.t('Created')}</DataTableColumnHeader>
                        <DataTableColumnHeader>{i18n.t('Actions')}</DataTableColumnHeader>
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
                            <DataTableCell>
                                <TableActionButton destructive onClick={() => setDeleting(policy)}>
                                    {i18n.t('Delete')}
                                </TableActionButton>
                            </DataTableCell>
                        </DataTableRow>
                    )) : (
                        <DataTableRow>
                            <DataTableCell colSpan="4" align="center">
                                {i18n.t('No alert policies yet. Create one to choose it in a prediction setup.')}
                            </DataTableCell>
                        </DataTableRow>
                    )}
                </DataTableBody>
            </DataTable>
            {creating && <CreateAlertPolicyModal onClose={() => setCreating(false)} />}
            {deleting && <DeleteAlertPolicyModal policy={deleting} onClose={() => setDeleting(undefined)} />}
        </div>
    );
};
