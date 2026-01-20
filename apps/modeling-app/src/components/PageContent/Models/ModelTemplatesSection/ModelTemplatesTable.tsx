import React, { useState } from 'react';
import {
    Button,
    DataTable,
    DataTableHead,
    DataTableRow,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    IconDelete16,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { ModelTemplateRead } from '@dhis2-chap/ui';
import { DeleteModelTemplateModal } from './DeleteModelTemplateModal';

const labelByPeriodType: Record<string, string> = {
    month: i18n.t('Monthly'),
    year: i18n.t('Yearly'),
    week: i18n.t('Weekly'),
    day: i18n.t('Daily'),
    any: i18n.t('Any'),
};

type Props = {
    modelTemplates: ModelTemplateRead[];
};

export const ModelTemplatesTable = ({ modelTemplates }: Props) => {
    const [templateToDelete, setTemplateToDelete] = useState<ModelTemplateRead | null>(null);

    return (
        <>
            <DataTable>
                <DataTableHead>
                    <DataTableRow>
                        <DataTableColumnHeader>
                            {i18n.t('Name')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Author')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Version')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Period')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Actions')}
                        </DataTableColumnHeader>
                    </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                    {modelTemplates.length > 0 ? (
                        modelTemplates.map(template => (
                            <DataTableRow key={template.id}>
                                <DataTableCell>
                                    {template.displayName || template.name}
                                </DataTableCell>
                                <DataTableCell>
                                    {template.author || '-'}
                                </DataTableCell>
                                <DataTableCell>
                                    {template.version || '-'}
                                </DataTableCell>
                                <DataTableCell>
                                    {template.supportedPeriodType
                                        ? labelByPeriodType[template.supportedPeriodType] || template.supportedPeriodType
                                        : '-'}
                                </DataTableCell>
                                <DataTableCell>
                                    <Button
                                        small
                                        secondary
                                        destructive
                                        icon={<IconDelete16 />}
                                        onClick={() => setTemplateToDelete(template)}
                                        dataTest={`delete-template-${template.id}`}
                                    >
                                        {i18n.t('Delete')}
                                    </Button>
                                </DataTableCell>
                            </DataTableRow>
                        ))
                    ) : (
                        <DataTableRow>
                            <DataTableCell colSpan="5" align="center">
                                {i18n.t('No model templates installed')}
                            </DataTableCell>
                        </DataTableRow>
                    )}
                </DataTableBody>
            </DataTable>

            {templateToDelete && (
                <DeleteModelTemplateModal
                    id={templateToDelete.id}
                    name={templateToDelete.displayName || templateToDelete.name}
                    onClose={() => setTemplateToDelete(null)}
                />
            )}
        </>
    );
};
