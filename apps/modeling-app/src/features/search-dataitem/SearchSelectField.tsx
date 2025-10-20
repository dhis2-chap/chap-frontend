import React, { useRef, useState } from 'react';
import { z } from 'zod';
import i18n from '@dhis2/d2-i18n';
import styles from './SearchSelectField.module.css';
import { Label, Layer, Popper, IconChevronDown16, IconCross16 } from '@dhis2/ui';
import { useApiDataQuery } from '../../utils/useApiDataQuery';
import { useDebounce } from '../../hooks/useDebounce';
import { dimensionItemTypeSchema } from '../../components/NewEvaluationFormContainer/NewEvaluationForm/hooks/useFormController';

interface Option {
    id: string;
    displayName: string;
    dimensionItemType: z.infer<typeof dimensionItemTypeSchema>;
}

interface DataItemsResponse {
    dataItems: Option[];
}

type Feature = {
    id: string;
    name: string;
    displayName: string;
    description: string;
};

interface SearchSelectFieldProps {
    feature: Feature;
    onChangeSearchSelectField: (
        feature: Feature,
        dataItemId: string,
        dataItemDisplayName: string,
        dimensionItemType: z.infer<typeof dimensionItemTypeSchema>
    ) => void;
    defaultValue?: {
        id: string;
        displayName: string;
        dimensionItemType: string | null | undefined;
    };
    onResetField: () => void;
}

const DIMENSION_ITEM_TYPE_LABELS = {
    PROGRAM_DATA_ELEMENT: i18n.t('Data Element'),
    INDICATOR: i18n.t('Indicator'),
    PROGRAM_INDICATOR: i18n.t('Program Indicator'),
    DATA_ELEMENT: i18n.t('Data Element'),
};

const SearchSelectField = ({
    feature,
    onChangeSearchSelectField,
    defaultValue,
    onResetField,
}: SearchSelectFieldProps) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedOption, setSelectedOption] = useState<Option | null>(() => {
        if (defaultValue && defaultValue.id && defaultValue.displayName) {
            return {
                id: defaultValue.id,
                displayName: defaultValue.displayName,
                dimensionItemType: defaultValue.dimensionItemType as z.infer<typeof dimensionItemTypeSchema>,
            };
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
                fields: 'id,displayName,dimensionItemType',
                order: 'displayName:asc',
                page: 1,
                pageSize: 20,
            },
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });

    const dataItems = data?.dataItems || [];

    const handleTriggerClick = () => {
        setIsDropdownOpen(!isDropdownOpen);
        setSearchQuery('');

        // Focus the search input when dropdown opens
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

    const handleOptionClick = (option: Option) => {
        setSelectedOption(option);
        setSearchQuery('');
        setIsDropdownOpen(false);
        onChangeSearchSelectField(feature, option.id, option.displayName, option.dimensionItemType);
    };

    const handleClearSelection = (event: React.MouseEvent) => {
        event.stopPropagation();
        setSelectedOption(null);
        setSearchQuery('');
        onResetField();
    };

    const renderList = () => {
        if (isLoading) {
            return <li className={styles.infoSearchItem}>{i18n.t('Loading')}</li>;
        }
        if (dataItems.length === 0 && searchQuery.length === 0) {
            return (
                <li className={styles.infoSearchItem}>
                    {i18n.t('Start typing to search for data items')}
                </li>
            );
        }
        if (dataItems.length === 0 && searchQuery.length > 0) {
            return <li className={styles.infoSearchItem}>{i18n.t('No matches found')}</li>;
        }

        return (
            <>
                {dataItems.map(option => (
                    <li
                        key={option.id}
                        onClick={() => handleOptionClick(option)}
                        className={styles.dropDownItem}
                    >
                        <div>{option.displayName}</div>
                        <div className={styles.rightDropDownItem}>
                            {DIMENSION_ITEM_TYPE_LABELS[option.dimensionItemType as keyof typeof DIMENSION_ITEM_TYPE_LABELS]}
                        </div>
                    </li>
                ))}
            </>
        );
    };

    return (
        <div className={styles.searchSelectField}>
            <Label className={styles.label}>
                {feature.displayName}
            </Label>

            <div ref={anchorRef} className={styles.selectContainer}>
                <button
                    type="button"
                    onClick={handleTriggerClick}
                    className={`${styles.triggerButton} ${selectedOption ? styles.hasSelection : ''}`}
                >
                    <span className={styles.triggerText}>
                        {selectedOption ? selectedOption.displayName : 'Select a data item...'}
                    </span>

                    <div className={styles.iconContainer}>
                        {selectedOption && (
                            <button
                                type="button"
                                onClick={handleClearSelection}
                                className={styles.clearButton}
                                aria-label="Clear selection"
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
        </div>
    );
};

export default SearchSelectField;
