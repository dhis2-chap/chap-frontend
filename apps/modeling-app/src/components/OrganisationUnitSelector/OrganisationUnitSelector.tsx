import { useDataEngine } from '@dhis2/app-runtime';
import {
    OrganisationUnitTree,
    Checkbox,
    SingleSelectField,
    SingleSelectOption,
    MultiSelect,
    MultiSelectOption,
    Button,
    IconWarningFilled16,
    colors,
} from '@dhis2/ui';
import cx from 'classnames';
import React, { useEffect, useState } from 'react';
import {
    apiFetchOrganisationUnitGroups,
    apiFetchOrganisationUnitLevels,
} from './api/organisationUnits';
import { formatList } from './modules/list';
import {
    ouIdHelper,
    USER_ORG_UNIT,
    USER_ORG_UNIT_CHILDREN,
    USER_ORG_UNIT_GRANDCHILDREN,
} from './modules/ouIdHelper';
import { DIMENSION_ID_ORGUNIT } from './modules/predefinedDimensions';
import styles from './styles/OrganisationUnitSelector.module.css';

export const DYNAMIC_ORG_UNITS = [
    USER_ORG_UNIT,
    USER_ORG_UNIT_CHILDREN,
    USER_ORG_UNIT_GRANDCHILDREN,
];

export interface OrganisationUnit {
    id: string;
    name?: string;
    displayName?: string;
    path?: string;
    level?: number;
}

export interface OrganisationUnitLevel {
    id: string;
    level: number;
    displayName: string;
    name: string;
}

export interface OrganisationUnitGroup {
    id: string;
    displayName: string;
    name: string;
}

export interface I18nInstance {
    t: (key: string, options?: Record<string, any>) => string;
    language?: string;
}

export interface SelectionChangeEvent {
    dimensionId: string;
    items: OrganisationUnit[];
}

export interface OrganisationUnitSelectorProps {
    roots: string[];
    selected: OrganisationUnit[];
    onSelect: (event: SelectionChangeEvent) => void;
    hideGroupSelect?: boolean;
    hideLevelSelect?: boolean;
    hideUserOrgUnits?: boolean;
    warning?: string;
    displayNameProp?: 'displayName' | 'name' | 'shortName';
    i18n?: I18nInstance;
}

interface TreeSelectionItem {
    id: string;
    checked: boolean;
    displayName: string;
    path?: string;
}

const OrganisationUnitSelector: React.FC<OrganisationUnitSelectorProps> = ({
    roots,
    selected,
    onSelect,
    hideGroupSelect = false,
    hideLevelSelect = false,
    hideUserOrgUnits = false,
    warning,
    displayNameProp = 'displayName',
    i18n,
}) => {
    const [ouLevels, setOuLevels] = useState<OrganisationUnitLevel[]>([]);
    const [ouGroups, setOuGroups] = useState<OrganisationUnitGroup[]>([]);
    const dataEngine = useDataEngine();

    const onSelectItems = (selectedItem: TreeSelectionItem): void => {
        const { id, checked, displayName, path } = selectedItem;
        let result = [...selected];

        if (checked && DYNAMIC_ORG_UNITS.includes(id)) {
            result = [...result, { id, displayName }];
        } else if (checked) {
            result.push({ id, path, name: displayName });
        } else {
            result = [...result.filter(item => item.id !== id)];
        }

        onSelect({
            dimensionId: DIMENSION_ID_ORGUNIT,
            items: result,
        });
    };

    const clearSelection = (): void =>
        onSelect({
            dimensionId: DIMENSION_ID_ORGUNIT,
            items: [],
        });

    useEffect(() => {
        const doFetchOuLevels = async (): Promise<void> => {
            const result = await apiFetchOrganisationUnitLevels(dataEngine);
            result.sort((a, b) => (a.level > b.level ? 1 : -1));
            setOuLevels(result);
        };
        const doFetchOuGroups = async (): Promise<void> => {
            const result = await apiFetchOrganisationUnitGroups(
                dataEngine,
                displayNameProp,
            );
            setOuGroups(result);
        };

        if (!hideLevelSelect) {
            doFetchOuLevels();
        }
        if (!hideGroupSelect) {
            doFetchOuGroups();
        }
    }, [dataEngine, hideLevelSelect, hideGroupSelect, displayNameProp]);

    const onLevelChange = (id: string): void => {
        // Filter out any existing level selections
        const filteredItems = selected.filter(ou => !ouIdHelper.hasLevelPrefix(ou.id));

        // If id is empty (cleared), just use the filtered items
        // Otherwise, add the new level selection
        const items = id ? [
            ...filteredItems,
            {
                id: ouIdHelper.addLevelPrefix(id),
                name: ouLevels.find(level => level.id === id)?.displayName || '',
            },
        ] : filteredItems;

        onSelect({
            dimensionId: DIMENSION_ID_ORGUNIT,
            items,
        });
    };

    const onGroupChange = (ids: string[]): void => {
        const items = ids.map(id => ({
            id: ouIdHelper.addGroupPrefix(id),
            name: ouGroups.find(group => group.id === id)?.displayName || '',
        }));

        onSelect({
            dimensionId: DIMENSION_ID_ORGUNIT,
            items: [
                ...selected.filter(ou => !ouIdHelper.hasGroupPrefix(ou.id)),
                ...items,
            ],
        });
    };

    const getSummary = (): string => {
        let summary: string;
        if (selected.length) {
            const numberOfOrgUnits = selected.filter(
                item =>
                    !DYNAMIC_ORG_UNITS.includes(item.id) &&
                    !ouIdHelper.hasLevelPrefix(item.id) &&
                    !ouIdHelper.hasGroupPrefix(item.id),
            ).length;

            const numberOfLevels = selected.filter(item =>
                ouIdHelper.hasLevelPrefix(item.id),
            ).length;
            const numberOfGroups = selected.filter(item =>
                ouIdHelper.hasGroupPrefix(item.id),
            ).length;
            const userOrgUnits = selected.filter(item =>
                DYNAMIC_ORG_UNITS.includes(item.id),
            );

            const parts: string[] = [];

            if (numberOfOrgUnits) {
                parts.push(
                    i18n?.t ? i18n.t('{{count}} org units', {
                        count: numberOfOrgUnits,
                        defaultValue: '{{count}} org unit',
                        defaultValue_plural: '{{count}} org units',
                    }) : `${numberOfOrgUnits} org unit${numberOfOrgUnits > 1 ? 's' : ''}`,
                );
            }
            if (numberOfLevels) {
                parts.push(
                    i18n?.t ? i18n.t('{{count}} levels', {
                        count: numberOfLevels,
                        defaultValue: '{{count}} level',
                        defaultValue_plural: '{{count}} levels',
                    }) : `${numberOfLevels} level${numberOfLevels > 1 ? 's' : ''}`,
                );
            }
            if (numberOfGroups) {
                parts.push(
                    i18n?.t ? i18n.t('{{count}} groups', {
                        count: numberOfGroups,
                        defaultValue: '{{count}} group',
                        defaultValue_plural: '{{count}} groups',
                    }) : `${numberOfGroups} group${numberOfGroups > 1 ? 's' : ''}`,
                );
            }
            userOrgUnits.forEach((orgUnit) => {
                parts.push(orgUnit.name || orgUnit.displayName || '');
            });
            summary = i18n?.t ? i18n.t(
                'Selected: {{commaSeparatedListOfOrganisationUnits}}',
                {
                    keySeparator: '>',
                    nsSeparator: '|',
                    commaSeparatedListOfOrganisationUnits: formatList(parts),
                },
            ) : `Selected: ${formatList(parts)}`;
        } else {
            summary = i18n?.t ? i18n.t('Nothing selected') : 'Nothing selected';
        }

        return summary;
    };

    return (
        <div className={styles.container}>
            {!hideUserOrgUnits && (
                <div className={styles.userOrgUnitsWrapper}>
                    <Checkbox
                        label={i18n?.t ? i18n.t('User organisation unit') : 'User organisation unit'}
                        checked={selected.some(
                            item => item.id === USER_ORG_UNIT,
                        )}
                        onChange={({ checked }) =>
                            onSelectItems({
                                id: USER_ORG_UNIT,
                                checked,
                                displayName: i18n?.t ? i18n.t('User organisation unit') : 'User organisation unit',
                            })}
                        dense
                    />
                    <Checkbox
                        label={i18n?.t ? i18n.t('User sub-units') : 'User sub-units'}
                        checked={selected.some(
                            item => item.id === USER_ORG_UNIT_CHILDREN,
                        )}
                        onChange={({ checked }) =>
                            onSelectItems({
                                id: USER_ORG_UNIT_CHILDREN,
                                checked,
                                displayName: i18n?.t ? i18n.t('User sub-units') : 'User sub-units',
                            })}
                        dense
                    />
                    <Checkbox
                        label={i18n?.t ? i18n.t('User sub-x2-units') : 'User sub-x2-units'}
                        checked={selected.some(
                            item => item.id === USER_ORG_UNIT_GRANDCHILDREN,
                        )}
                        onChange={({ checked }) =>
                            onSelectItems({
                                id: USER_ORG_UNIT_GRANDCHILDREN,
                                checked,
                                displayName: i18n?.t ? i18n.t('User sub-x2-units') : 'User sub-x2-units',
                            })}
                        dense
                    />
                </div>
            )}
            <div className={styles.orgUnitTreeWrapper}>
                <OrganisationUnitTree
                    roots={roots}
                    initiallyExpanded={[
                        ...(roots.length === 1 ? [`/${roots[0]}`] : []),
                        ...selected
                            .filter(
                                item =>
                                    !DYNAMIC_ORG_UNITS.includes(item.id) &&
                                    !ouIdHelper.hasLevelPrefix(item.id) &&
                                    !ouIdHelper.hasGroupPrefix(item.id),
                            )
                            .map(item =>
                                item.path?.substring(
                                    0,
                                    item.path.lastIndexOf('/'),
                                ) || '',
                            )
                            .filter(path => path),
                    ]}
                    selected={selected
                        .filter(
                            item =>
                                !DYNAMIC_ORG_UNITS.includes(item.id) &&
                                !ouIdHelper.hasLevelPrefix(item.id) &&
                                !ouIdHelper.hasGroupPrefix(item.id),
                        )
                        .map(item => item.path)
                        .filter((path): path is string => Boolean(path))}
                    onChange={onSelectItems}
                    dataTest="org-unit-tree"
                />
            </div>
            <div
                className={cx(styles.selectsWrapper, {
                    [styles.hidden]: hideLevelSelect && hideGroupSelect,
                })}
            >
                {!hideLevelSelect && (
                    <SingleSelectField
                        selected={
                            ouLevels.length
                                ? selected
                                    .filter(item =>
                                        ouIdHelper.hasLevelPrefix(item.id),
                                    )
                                    .map(item =>
                                        ouIdHelper.removePrefix(item.id),
                                    )[0] || ''
                                : ''
                        }
                        onChange={({ selected }) => onLevelChange(selected)}
                        placeholder={i18n?.t ? i18n.t('Select a level') : 'Select a level'}
                        loading={!ouLevels.length}
                        dense
                        clearable
                        clearText={i18n?.t ? i18n.t('Clear') : 'Clear'}
                        dataTest="org-unit-level-select"
                    >
                        {ouLevels.map(level => (
                            <SingleSelectOption
                                key={level.id}
                                value={level.id}
                                label={level.displayName}
                                dataTest={`org-unit-level-select-option-${level.id}`}
                            />
                        ))}
                    </SingleSelectField>
                )}
                {!hideGroupSelect && (
                    <MultiSelect
                        selected={
                            ouGroups.length
                                ? selected
                                        .filter(item =>
                                            ouIdHelper.hasGroupPrefix(item.id),
                                        )
                                        .map(item =>
                                            ouIdHelper.removePrefix(item.id),
                                        )
                                : []
                        }
                        onChange={({ selected }) => onGroupChange(selected)}
                        placeholder={i18n?.t ? i18n.t('Select a group') : 'Select a group'}
                        loading={!ouGroups.length}
                        dense
                        dataTest="org-unit-group-select"
                    >
                        {ouGroups.map(group => (
                            <MultiSelectOption
                                key={group.id}
                                value={group.id}
                                label={group.displayName}
                                dataTest={`org-unit-group-select-option-${group.id}`}
                            />
                        ))}
                    </MultiSelect>
                )}
            </div>
            <div className={styles.summaryWrapper}>
                {warning ? (
                    <div className={styles.warningWrapper}>
                        <IconWarningFilled16 color={colors.red500} />
                        <span className={styles.warningText}>{warning}</span>
                    </div>
                ) : (
                    <span className={styles.summaryText}>{getSummary()}</span>
                )}
                <div className={styles.deselectButton}>
                    <Button
                        secondary
                        small
                        onClick={clearSelection}
                        disabled={!selected.length}
                    >
                        {i18n?.t ? i18n.t('Deselect all') : 'Deselect all'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default OrganisationUnitSelector;
