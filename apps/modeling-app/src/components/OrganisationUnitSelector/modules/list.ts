export const formatList = (items: string[]): string => {
    // Wrap Intl.ListFormat in try/catch as DHIS2 locales are not always ISO 639 compliant
    try {
        // Default to 'en' if i18n.language is not available
        // Note: i18n is not available in this context, so we default to 'en'
        const language = 'en'
        const formatter = new Intl.ListFormat(language, {
            style: 'long',
            type: 'conjunction',
        })
        return formatter.format(items)
    } catch (error) {
        console.error(error)
        return items.join(', ')
    }
} 