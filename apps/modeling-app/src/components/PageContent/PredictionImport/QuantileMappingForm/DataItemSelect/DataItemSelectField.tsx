import { useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Label, Layer, Popper, IconChevronDown16, IconCross16 } from '@dhis2/ui';
import { useApiDataQuery } from '@/utils/useApiDataQuery';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './DataItemSelect.module.css';
import clsx from 'clsx';

type DataItem = {
    id: string;
    displayName: string;
};

type DataItemsResponse = {
    dataItems: DataItem[];
};

interface DataItemSelectFieldProps {
    initialDataItem?: DataItem;
    initialDataItems: DataItem[];
    initialLoading: boolean;
    onChange: (id: string | null) => void;
    label?: string;
    value?: string;
    error?: string;
}

export const DataItemSelectField = ({
    initialDataItem,
    initialDataItems,
    initialLoading,
    onChange,
    label,
    error,
}: DataItemSelectFieldProps) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedOption, setSelectedOption] = useState<DataItem | null>(() => {
        if (initialDataItem) {
            return initialDataItem;
        }
        return null;
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    const debouncedQuery = useDebounce(searchQuery, 300);

    const anchorRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { data, isLoading } = useApiDataQuery<DataItemsResponse>({
        queryKey: ['dataItems', debouncedQuery],
        query: {
            resource: 'dataItems',
            params: {
                filter: [
                    ...(debouncedQuery ? [`displayName:ilike:${debouncedQuery}`] : []),
                    'dimensionItemType:in:[PROGRAM_DATA_ELEMENT,INDICATOR,PROGRAM_INDICATOR,DATA_ELEMENT]',
                ],
                fields: 'id,displayName',
                order: 'displayName:asc',
                page: 1,
                pageSize: 20,
            },
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });

    const searchResults = data?.dataItems || [];
    const displayItems = debouncedQuery ? searchResults : initialDataItems;

    const handleTriggerClick = () => {
        setIsDropdownOpen(!isDropdownOpen);
        setSearchQuery('');

        if (!isDropdownOpen) {
            setTimeout(() => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 100);
        }
    };

    const handleBackdropClick = () => {
        setIsDropdownOpen(false);
        setSearchQuery('');
    };

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = event.target.value;
        setSearchQuery(newQuery);
    };

    const handleOptionClick = (option: DataItem) => {
        setSelectedOption(option);
        setSearchQuery('');
        setIsDropdownOpen(false);
        onChange(option.id);
    };

    const handleClearSelection = (event: React.MouseEvent) => {
        event.stopPropagation();
        setSelectedOption(null);
        setSearchQuery('');
        onChange(null);
    };

    const renderList = () => {
        if ((isLoading || initialLoading) && debouncedQuery) {
            return <li className={styles.infoSearchItem}>{i18n.t('Loading')}</li>;
        }
        if (displayItems.length === 0 && searchQuery.length === 0) {
            return (
                <li className={styles.infoSearchItem}>
                    {i18n.t('Start typing to search for data items')}
                </li>
            );
        }
        if (displayItems.length === 0 && searchQuery.length > 0) {
            return <li className={styles.infoSearchItem}>{i18n.t('No matches found')}</li>;
        }

        return (
            <>
                {displayItems.map(option => (
                    <li
                        key={option.id}
                        onClick={() => handleOptionClick(option)}
                        className={styles.dropDownItem}
                    >
                        <div>{option.displayName}</div>
                    </li>
                ))}
            </>
        );
    };

    return (
        <div className={styles.dataItemSelect}>
            {label && (
                <Label className={styles.label}>
                    {label}
                </Label>
            )}

            <div ref={anchorRef} className={styles.selectContainer}>
                <button
                    type="button"
                    onClick={handleTriggerClick}
                    className={clsx(
                        styles.triggerButton,
                        selectedOption && styles.hasSelection,
                        error && styles.hasError,
                    )}
                >
                    <span className={styles.triggerText}>
                        {selectedOption ? selectedOption.displayName : i18n.t('Select a data item...')}
                    </span>

                    <div className={styles.iconContainer}>
                        {selectedOption && (
                            <button
                                type="button"
                                onClick={handleClearSelection}
                                className={styles.clearButton}
                                aria-label={i18n.t('Clear selection')}
                            >
                                <IconCross16 />
                            </button>
                        )}

                        <div className={styles.dropdownIcon}>
                            <IconChevronDown16 />
                        </div>
                    </div>
                </button>
            </div>

            {isDropdownOpen && (
                <Layer onBackdropClick={handleBackdropClick}>
                    <Popper reference={anchorRef} placement="bottom-start">
                        <div className={styles.dropDown}>
                            <div className={styles.searchContainer}>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchInputChange}
                                    placeholder={i18n.t('Search for indicators, data elements, or program indicators')}
                                    className={styles.searchInput}
                                />
                            </div>
                            <ul className={styles.resultsList}>
                                {renderList()}
                            </ul>
                        </div>
                    </Popper>
                </Layer>
            )}
            {error && <p className={styles.errorText}>{error}</p>}
        </div>
    );
};
