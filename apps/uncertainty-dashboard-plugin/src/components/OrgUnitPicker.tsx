import {
    useMemo,
    useRef,
    useState,
} from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    IconChevronDown16,
    IconCross16,
    InputField,
    Layer,
    Popper,
} from '@dhis2/ui';
import classNames from 'classnames';
import { useApiDataQuery } from '@/utils/useApiDataQuery';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import type { OrgUnitOption } from '@/types';
import styles from './OrgUnitPicker.module.css';

type OrganisationUnitsResponse = {
    organisationUnits: OrgUnitOption[];
};

type OrgUnitPickerProps = {
    value: OrgUnitOption | null;
    onChange: (value: OrgUnitOption | null) => void;
    options?: OrgUnitOption[];
    disabled?: boolean;
};

const matchesSearchQuery = (orgUnit: OrgUnitOption, searchQuery: string): boolean => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    if (!normalizedSearchQuery) {
        return true;
    }

    return orgUnit.displayName.toLowerCase().includes(normalizedSearchQuery);
};

export const OrgUnitPicker = ({
    value,
    onChange,
    options: fixedOptions,
    disabled = false,
}: OrgUnitPickerProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
    const anchorRef = useRef<HTMLDivElement>(null);
    const shouldSearchApi = !fixedOptions;
    const { data, isLoading } = useApiDataQuery<OrganisationUnitsResponse>({
        queryKey: [
            'organisationUnits',
            'picker',
            debouncedSearchQuery,
            shouldSearchApi,
        ],
        query: {
            resource: 'organisationUnits',
            params: {
                filter: debouncedSearchQuery
                    ? [`displayName:ilike:${debouncedSearchQuery}`]
                    : undefined,
                fields: 'id,displayName,path',
                order: 'displayName:asc',
                page: 1,
                pageSize: 25,
            },
        },
        enabled: shouldSearchApi,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
    const options = useMemo(() => {
        if (!fixedOptions) {
            return data?.organisationUnits ?? [];
        }

        return fixedOptions.filter(orgUnit => matchesSearchQuery(orgUnit, debouncedSearchQuery));
    }, [data?.organisationUnits, debouncedSearchQuery, fixedOptions]);

    const handleOpen = () => {
        if (disabled) {
            return;
        }

        setSearchQuery('');
        setIsDropdownOpen(current => !current);
    };

    const handleClose = () => {
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const handleSelect = (option: OrgUnitOption) => {
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
                        : i18n.t('Start typing to search for organisation units')}
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
            </li>
        ));
    };

    return (
        <div className={styles.field}>
            <div ref={anchorRef} className={styles.selectContainer}>
                <button
                    type="button"
                    className={classNames(styles.triggerButton, {
                        [styles.triggerButtonDisabled]: disabled,
                    })}
                    onClick={handleOpen}
                    disabled={disabled}
                >
                    <span
                        className={classNames(styles.triggerText, {
                            [styles.placeholder]: !value,
                        })}
                    >
                        {value?.displayName ?? i18n.t('Select organisation unit')}
                    </span>
                    <span className={styles.iconContainer}>
                        {value && !disabled && (
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
            {isDropdownOpen && (
                <Layer onBackdropClick={handleClose}>
                    <Popper reference={anchorRef} placement="bottom-start">
                        <div className={styles.dropdown}>
                            <InputField
                                className={styles.search}
                                value={searchQuery}
                                placeholder={i18n.t('Search organisation units')}
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
