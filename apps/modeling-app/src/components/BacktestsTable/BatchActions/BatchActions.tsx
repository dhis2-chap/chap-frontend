import React from 'react';
import { Button, IconDelete16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Table } from '@tanstack/react-table';
import { BackTestRead } from '@dhis2-chap/ui';
import styles from './BatchActions.module.css';
import { useBatchDeleteBacktests } from '../hooks/useBatchDeleteBacktests';

type Props = {
    table: Table<BackTestRead>;
}

export const BatchActions = ({ table }: Props) => {
    const {
        deleteBacktests,
        isSubmitting: isBatchDeleting,
    } = useBatchDeleteBacktests({
        onSuccess: () => {
            table.resetRowSelection()
        },
    })

    const handleDelete = () => {
        const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.id)
        deleteBacktests(selectedIds)
    }

    return (
        <div className={styles.batchActionsContainer}>
            <div className={styles.leftSection}>
                {i18n.t('{{count}} evaluations selected', {
                    count: table.getSelectedRowModel().rows.length,
                    defaultValue: '{{count}} evaluation selected',
                    defaultValue_plural: '{{count}} evaluations selected',
                })}
            </div>

            <div className={styles.rightSection}>
                <Button
                    icon={<IconDelete16 />}
                    small
                    onClick={handleDelete}
                    loading={isBatchDeleting}
                >
                    {i18n.t('Delete')}
                </Button>

                <Button
                    small
                    onClick={() => table.resetRowSelection()}
                    disabled={isBatchDeleting}
                >
                    {i18n.t('Cancel')}
                </Button>
            </div>
        </div>
    );
}; 