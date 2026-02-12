import { useState, useMemo } from 'react';
import {
    Button,
    ButtonStrip,
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    createColumnHelper,
} from '@tanstack/react-table';
import { ModelSpecRead, AuthorAssessedStatus } from '@dhis2-chap/ui';
import { ModelCard } from '../ModelCard';
import { ModelFilters } from './ModelFilters';
import styles from './ModelSelectionModal.module.css';

type Props = {
    models?: ModelSpecRead[];
    selectedModel?: ModelSpecRead;
    onClose: () => void;
    onConfirm: (model: ModelSpecRead) => void;
};

const DefaultSortOrder = [
    AuthorAssessedStatus.GREEN,
    AuthorAssessedStatus.YELLOW,
    AuthorAssessedStatus.ORANGE,
    AuthorAssessedStatus.RED,
    AuthorAssessedStatus.GRAY,
];

export const ModelSelectionModal = ({
    models,
    selectedModel: initialSelectedModel,
    onClose,
    onConfirm,
}: Props) => {
    const [selectedModel, setSelectedModel] = useState<ModelSpecRead | undefined>(initialSelectedModel);

    const handleModalClose = () => {
        setSelectedModel(undefined);
        onClose();
    };

    const handleModalConfirm = () => {
        if (selectedModel) {
            onConfirm(selectedModel);
        }
        handleModalClose();
    };

    const onModelSelect = (model: ModelSpecRead) => {
        if (selectedModel?.id === model.id) {
            setSelectedModel(undefined);
        } else {
            setSelectedModel(model);
        }
    };

    const columnHelper = createColumnHelper<ModelSpecRead>();

    const columns = useMemo(
        () => [
            columnHelper.accessor('displayName', {
                id: 'displayName',
                enableColumnFilter: true,
                filterFn: 'includesString',
            }),
            columnHelper.accessor('supportedPeriodType', {
                id: 'supportedPeriodType',
                enableColumnFilter: true,
                filterFn: 'includesString',
            }),
            columnHelper.accessor('authorAssessedStatus', {
                id: 'authorAssessedStatus',
                enableColumnFilter: true,
                filterFn: 'equalsString',
                sortingFn: (rowA, rowB) => {
                    const statusA = rowA.original.authorAssessedStatus;
                    const statusB = rowB.original.authorAssessedStatus;

                    // Handle undefined values (put them at the end)
                    if (!statusA && !statusB) return 0;
                    if (!statusA) return 1;
                    if (!statusB) return -1;

                    const indexA = DefaultSortOrder.indexOf(statusA);
                    const indexB = DefaultSortOrder.indexOf(statusB);

                    // Handle unknown statuses (put them at the end)
                    if (indexA === -1 && indexB === -1) return 0;
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;

                    return indexA - indexB;
                },
            }),
        ],
        [],
    );

    const table = useReactTable({
        data: models || [],
        columns,
        initialState: {
            pagination: {
                pageSize: 5,
            },
            sorting: [{ id: 'authorAssessedStatus', desc: false }],
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const filteredRows = table.getRowModel().rows;

    return (
        <Modal fluid className={styles.modelModal} onClose={handleModalClose}>
            <ModalTitle>{i18n.t('Select Model')}</ModalTitle>
            <ModalContent>
                <div className={styles.filterBar}>
                    <ModelFilters table={table} />
                </div>
                <div className={styles.content}>
                    <div className={styles.modelGrid}>
                        {filteredRows.length > 0 ? filteredRows.map(row => (
                            <ModelCard
                                key={row.original.id}
                                model={row.original}
                                isSelected={selectedModel?.id === row.original.id}
                                onSelect={onModelSelect}
                            />
                        )) : (
                            <div className={styles.noResults}>
                                {i18n.t('No models found')}
                            </div>
                        )}
                    </div>
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={handleModalClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button primary onClick={handleModalConfirm} disabled={!selectedModel}>
                        {i18n.t('Confirm Selection')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
