import {
    useRef,
    useState,
} from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    IconChevronDown16,
    IconCross16,
    InputField,
    Label,
    Layer,
    Popper,
} from '@dhis2/ui';
import classNames from 'classnames';
import { useApiDataQuery } from '@/utils/useApiDataQuery';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import type { DataItemOption } from '@/types';
import styles from './DataItemPicker.module.css';

type DataItemsResponse = {
    dataItems: DataItemOption[];
};

type DataItemPickerProps = {
    label: string;
    value: DataItemOption | null;
    onChange: (value: DataItemOption | null) => void;
    dataElementsOnly?: boolean;
    error?: string;
    suggestedKeyword?: string;
};

const DIMENSION_ITEM_TYPE_LABELS = {
    PROGRAM_DATA_ELEMENT: i18n.t('Program data element'),
    INDICATOR: i18n.t('Indicator'),
    PROGRAM_INDICATOR: i18n.t('Program indicator'),
    DATA_ELEMENT: i18n.t('Data element'),
};

const getDimensionItemTypeFilter = (dataElementsOnly: boolean) => (
    dataElementsOnly
        ? 'dimensionItemType:in:[DATA_ELEMENT]'
        : 'dimensionItemType:in:[PROGRAM_DATA_ELEMENT,INDICATOR,PROGRAM_INDICATOR,DATA_ELEMENT]'
);

export const DataItemPicker = ({
    label,
    value,
    onChange,
    dataElementsOnly = false,
    error,
    suggestedKeyword,
}: DataItemPickerProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
    const normalizedSuggestedKeyword = suggestedKeyword?.trim();
    const anchorRef = useRef<HTMLDivElement>(null);
    const { data, isLoading } = useApiDataQuery<DataItemsResponse>({
        queryKey: [
            'dataItems',
            dataElementsOnly ? 'dataElements' : 'allDataItems',
            debouncedSearchQuery,
            normalizedSuggestedKeyword,
        ],
        query: {
            resource: 'dataItems',
            params: {
                filter: [
                    ...(debouncedSearchQuery
                        ? [`displayName:ilike:${debouncedSearchQuery}`]
                        : normalizedSuggestedKeyword
                            ? [`displayName:ilike:${normalizedSuggestedKeyword}`]
                            : []),
                    getDimensionItemTypeFilter(dataElementsOnly),
                ],
                fields: 'id,displayName,dimensionItemType',
                order: 'displayName:asc',
                page: 1,
                pageSize: 25,
            },
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
    const options = data?.dataItems ?? [];

    const handleOpen = () => {
        setSearchQuery('');
        setIsDropdownOpen(current => !current);
    };

    const handleClose = () => {
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const handleSelect = (option: DataItemOption) => {
        onChange(option);
        handleClose();
    };

    const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onChange(null);
        setSearchQuery('');
    };

    const renderOptions = () => {
        if (isLoading) {
            return <li className={styles.infoItem}>{i18n.t('Loading')}</li>;
        }

        if (options.length === 0) {
            return (
                <li className={styles.infoItem}>
                    {searchQuery
                        ? i18n.t('No matches found')
                        : i18n.t('Start typing to search for data items')}
                </li>
            );
        }

        return options.map(option => (
            <li
                key={option.id}
                className={styles.resultItem}
                onClick={() => handleSelect(option)}
                role="option"
            >
                <span className={styles.resultName}>{option.displayName}</span>
                <span className={styles.resultType}>
                    {DIMENSION_ITEM_TYPE_LABELS[option.dimensionItemType]}
                </span>
            </li>
        ));
    };

    return (
        <div className={styles.field}>
            <Label className={styles.label}>{label}</Label>
            <div ref={anchorRef} className={styles.selectContainer}>
                <button
                    type="button"
                    className={classNames(styles.triggerButton, {
                        [styles.triggerButtonError]: !!error,
                    })}
                    onClick={handleOpen}
                >
                    <span
                        className={classNames(styles.triggerText, {
                            [styles.placeholder]: !value,
                        })}
                    >
                        {value?.displayName ?? i18n.t('Select a data item')}
                    </span>
                    <span className={styles.iconContainer}>
                        {value && (
                            <button
                                type="button"
                                className={styles.clearButton}
                                onClick={handleClear}
                                aria-label={i18n.t('Clear selection')}
                            >
                                <IconCross16 />
                            </button>
                        )}
                        <IconChevronDown16 />
                    </span>
                </button>
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
            {isDropdownOpen && (
                <Layer onBackdropClick={handleClose}>
                    <Popper reference={anchorRef} placement="bottom-start">
                        <div className={styles.dropdown}>
                            <InputField
                                className={styles.search}
                                value={searchQuery}
                                placeholder={i18n.t('Search data items')}
                                onChange={({ value: nextValue }: { value?: string }) => {
                                    setSearchQuery(nextValue ?? '');
                                }}
                            />
                            <ul className={styles.resultsList} role="listbox">
                                {renderOptions()}
                            </ul>
                        </div>
                    </Popper>
                </Layer>
            )}
        </div>
    );
};
