import i18n from '@dhis2/d2-i18n'
import { ouIdHelper, DYNAMIC_ORG_UNITS } from ".."
import { formatList } from ".."

export const getSelectionSummary = (selected: any[]): string => {
    if (!selected.length) {
        return i18n.t('Nothing selected')
    }

    const numberOfOrgUnits = selected.filter(
        (item) =>
            !DYNAMIC_ORG_UNITS.includes(item.id) &&
            !ouIdHelper.hasLevelPrefix(item.id) &&
            !ouIdHelper.hasGroupPrefix(item.id)
    ).length

    const numberOfLevels = selected.filter((item) =>
        ouIdHelper.hasLevelPrefix(item.id)
    ).length

    const numberOfGroups = selected.filter((item) =>
        ouIdHelper.hasGroupPrefix(item.id)
    ).length

    const userOrgUnits = selected.filter((item) =>
        DYNAMIC_ORG_UNITS.includes(item.id)
    )

    const parts: string[] = []

    if (numberOfOrgUnits) {
        parts.push(
            i18n.t('{{count}} org units', {
                count: numberOfOrgUnits,
                defaultValue: '{{count}} org unit',
                defaultValue_plural: '{{count}} org units',
            })
        )
    }
    if (numberOfLevels) {
        parts.push(
            i18n.t('{{count}} levels', {
                count: numberOfLevels,
                defaultValue: '{{count}} level',
                defaultValue_plural: '{{count}} levels',
            })
        )
    }
    if (numberOfGroups) {
        parts.push(
            i18n.t('{{count}} groups', {
                count: numberOfGroups,
                defaultValue: '{{count}} group',
                defaultValue_plural: '{{count}} groups',
            })
        )
    }
    userOrgUnits.forEach((orgUnit) => {
        parts.push(orgUnit.name || orgUnit.displayName || '')
    })

    return i18n.t(
        'Selected: {{commaSeparatedListOfOrganisationUnits}}',
        {
            keySeparator: '>',
            nsSeparator: '|',
            commaSeparatedListOfOrganisationUnits: formatList(parts),
        }
    )
}