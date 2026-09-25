import { useRef, useState } from 'react';
import { z } from 'zod';
import i18n from '@dhis2/d2-i18n';
import styles from './SearchSelectField.module.css';
import { Label, Layer, Popper, IconChevronDown16, IconCross16 } from '@dhis2/ui';
import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';
import { useApiDataQuery } from '../../utils/useApiDataQuery';
import { useDebounce } from '../../hooks/useDebounce';
import { dimensionItemTypeSchema } from '../../components/ModelExecutionForm/hooks/useModelExecutionFormState';

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
        dimensionItemType: z.infer<typeof dimensionItemTypeSchema>,
    ) => void;
    defaultValue?: {
        id: string;
        displayName: string;
        dimensionItemType: string | null | undefined;
    };
    onResetField: () => void;
    dataTestKey?: string;
    /** Data items to offer first, before searching, e.g. the ones used for this feature before. */
    suggestedItemIds?: string[];
}

const DIMENSION_ITEM_TYPE_LABELS = {
    PROGRAM_DATA_ELEMENT: i18n.t('Data Element'),
    INDICATOR: i18n.t('Indicator'),
    PROGRAM_INDICATOR: i18n.t('Program Indicator'),
    DATA_ELEMENT: i18n.t('Data Element'),
};

export const SearchSelectField = ({
    feature,
    onChangeSearchSelectField,
    defaultValue,
    onResetField,
    dataTestKey,
    suggestedItemIds = [],
}: SearchSelectFieldProps) => {
    const dataEngine = useDataEngine();
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

    // dataItems cannot filter on several ids at once, so look each one up in a single engine query.
    const { data: suggestedItems = [] } = useQuery({
        queryKey: ['dataItems', 'byId', suggestedItemIds],
        queryFn: async () => {
            const response = await dataEngine.query(Object.fromEntries(suggestedItemIds.map((id, index) => [
                `item${index}`,
                { resource: 'dataItems', params: { filter: `id:eq:${id}`, fields: 'id,displayName,dimensionItemType', paging: false } },
            ])));
            return suggestedItemIds.flatMap((_, index) => (response[`item${index}`] as DataItemsResponse).dataItems);
        },
        enabled: isDropdownOpen && suggestedItemIds.length > 0,
        staleTime: 5 * 60 * 1000,
    });
    const showSuggestions = !searchQuery && suggestedItems.length > 0;
    const dataItems = (data?.dataItems || []).filter(item => (
        !showSuggestions || !suggestedItems.some(suggested => suggested.id === item.id)
    ));

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
        if (dataItems.length === 0 && searchQuery.length === 0 && !showSuggestions) {
            return (
                <li className={styles.infoSearchItem}>
                    {i18n.t('Start typing to search for data items')}
                </li>
            );
        }
        if (dataItems.length === 0 && searchQuery.length > 0) {
            return <li className={styles.infoSearchItem}>{i18n.t('No matches found')}</li>;
        }

        const renderOption = (option: Option) => (
            <li
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className={styles.dropDownItem}
                role="option"
                data-test={dataTestKey ? `${dataTestKey}-option-${option.id}` : undefined}
            >
                <div>{option.displayName}</div>
                <div className={styles.rightDropDownItem}>
                    {DIMENSION_ITEM_TYPE_LABELS[option.dimensionItemType as keyof typeof DIMENSION_ITEM_TYPE_LABELS]}
                </div>
            </li>
        );

        if (showSuggestions) {
            return (
                <>
                    <li className={styles.groupLabel} role="presentation">{i18n.t('Used before')}</li>
                    {suggestedItems.map(renderOption)}
                    <li className={styles.groupLabel} role="presentation">{i18n.t('All data items')}</li>
                    {dataItems.map(renderOption)}
                </>
            );
        }

        return <>{dataItems.map(renderOption)}</>;
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
                    data-test={dataTestKey ? `${dataTestKey}-trigger` : undefined}
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
                                    data-test={dataTestKey ? `${dataTestKey}-search` : undefined}
                                />
                            </div>
                            <ul
                                className={styles.resultsList}
                                role="listbox"
                                data-test={dataTestKey ? `${dataTestKey}-options` : undefined}
                            >
                                {renderList()}
                            </ul>
                        </div>
                    </Popper>
                </Layer>
            )}
        </div>
    );
};
