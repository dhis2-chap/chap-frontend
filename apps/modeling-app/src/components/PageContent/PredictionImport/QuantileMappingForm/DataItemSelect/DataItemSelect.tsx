import { useDataItemById } from '@/hooks/useDataItemById';
import { useApiDataQuery } from '@/utils/useApiDataQuery';
import { DataItemSelectField } from './DataItemSelectField';

type DataItem = {
    id: string;
    displayName: string;
};

type DataItemsResponse = {
    dataItems: DataItem[];
};

interface DataItemSelectProps {
    id?: string;
    onChange: (id: string | null) => void;
    label?: string;
    value?: string;
    error?: string;
    dataElementsOnly?: boolean;
}

export const DataItemSelect = ({
    id,
    onChange,
    label,
    value,
    error,
    dataElementsOnly = false,
}: DataItemSelectProps) => {
    const selectedId = id ?? value;
    const { dataItem: initialDataItem } = useDataItemById(selectedId);

    const { data: initialDataItemsData, isLoading: isLoadingInitialItems } = useApiDataQuery<DataItemsResponse>({
        queryKey: ['dataItems', 'initial'],
        query: {
            resource: 'dataItems',
            params: {
                filter: ['dimensionItemType:in:[DATA_ELEMENT]'],
                fields: 'id,displayName',
                order: 'displayName:asc',
                page: 1,
                pageSize: 20,
            },
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });

    const initialDataItems = initialDataItemsData?.dataItems || [];

    return (
        <DataItemSelectField
            initialDataItem={initialDataItem}
            initialDataItems={initialDataItems}
            initialLoading={isLoadingInitialItems}
            onChange={onChange}
            label={label}
            value={selectedId}
            error={error}
            dataElementsOnly={dataElementsOnly}
        />
    );
};
