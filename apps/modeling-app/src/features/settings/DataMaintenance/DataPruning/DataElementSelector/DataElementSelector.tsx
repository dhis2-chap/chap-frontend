import React, { useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Layer, Popper, IconChevronDown16, IconCross16 } from '@dhis2/ui';
import { useApiDataQuery } from '../../../../../utils/useApiDataQuery';
import { useDebounce } from '../../../../../hooks/useDebounce';
import styles from './DataElementSelector.module.css';

export interface DataElement {
    id: string;
    displayName: string;
}

interface DataElementsResponse {
    dataElements: DataElement[];
}

interface DataElementSelectorProps {
    value: DataElement | null;
    onChange: (dataElement: DataElement | null) => void;
    excludeIds?: string[];
    showRemoveButton?: boolean;
    onRemove?: () => void;
}

export const DataElementSelector = ({
    value,
    onChange,
    excludeIds = [],
    showRemoveButton = false,
    onRemove,
}: DataElementSelectorProps) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    const debouncedQuery = useDebounce(searchQuery, 300);

    const anchorRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data, isLoading } = useApiDataQuery<DataElementsResponse>({
        queryKey: ['dataElements', debouncedQuery],
        query: {
            resource: 'dataElements',
            params: {
                filter: debouncedQuery ? [`displayName:ilike:${debouncedQuery}`] : [],
                fields: 'id,displayName',
                order: 'displayName:asc',
                page: 1,
                pageSize: 20,
            },
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });

    const dataElements = (data?.dataElements || []).filter(
        (de: DataElement) => !excludeIds.includes(de.id),
    );

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
        setSearchQuery(event.target.value);
    };

    const handleOptionClick = (dataElement: DataElement) => {
        onChange(dataElement);
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const handleClearSelection = (event: React.MouseEvent) => {
        event.stopPropagation();
        onChange(null);
        setSearchQuery('');
    };

    const handleRemoveClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (onRemove) {
            onRemove();
        }
    };

    const renderList = () => {
        if (isLoading) {
            return <li className={styles.infoSearchItem}>{i18n.t('Loading...')}</li>;
        }
        if (dataElements.length === 0 && searchQuery.length === 0) {
            return (
                <li className={styles.infoSearchItem}>
                    {i18n.t('Start typing to search for data elements')}
                </li>
            );
        }
        if (dataElements.length === 0 && searchQuery.length > 0) {
            return <li className={styles.infoSearchItem}>{i18n.t('No matches found')}</li>;
        }

        return (
            <>
                {dataElements.map(dataElement => (
                    <li
                        key={dataElement.id}
                        onClick={() => handleOptionClick(dataElement)}
                        className={styles.dropDownItem}
                    >
                        {dataElement.displayName}
                    </li>
                ))}
            </>
        );
    };

    return (
        <div className={styles.selectorContainer}>
            <div ref={anchorRef} className={styles.selectContainer}>
                <button
                    type="button"
                    onClick={handleTriggerClick}
                    className={`${styles.triggerButton} ${value ? styles.hasSelection : ''}`}
                >
                    <span className={styles.triggerText}>
                        {value ? value.displayName : i18n.t('Select a data element...')}
                    </span>

                    <div className={styles.iconContainer}>
                        {value && (
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

            {showRemoveButton && (
                <button
                    type="button"
                    onClick={handleRemoveClick}
                    className={styles.removeButton}
                    aria-label={i18n.t('Remove data element')}
                >
                    <IconCross16 />
                </button>
            )}

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
                                    placeholder={i18n.t('Search for data elements')}
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
        </div>
    );
};
