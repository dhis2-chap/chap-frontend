export const getPeriodNameFromId = (periodId: string | undefined) => {
    // this should be moved to utils probably
    // or actually just use import { getPeriodNameFromId } from '@dhis2/multi-period-dimension'
    //console.log('periodId', periodId)
    if (!periodId) return 'NA'
    if (periodId.length == 4) {
        return periodId
    }
    if (periodId.includes('W')) {
        const match = periodId.match(/(\d{4})W(\d{1,2})/)
        if (!match || match.length < 3) {
            return periodId
        }
        const [year, week] = match.slice(1, 3)
        return `Week ${week.replace(/ˆ0/, '')} ${year}`
    }
    if (periodId.length == 6) {
        const year = periodId.slice(0, 4)
        const month = periodId.slice(4, 6)
        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ]
        const monthName = monthNames[parseInt(month) - 1]
        return `${monthName} ${year}`
    }

    return periodId
}

export const getPeriodISOFromId = (periodId: any) => {
    // this should be moved to utils probably
    // or actually just use import { getPeriodNameFromId } from '@dhis2/multi-period-dimension'
    //console.log('periodId', periodId)
    if (!periodId) return 'NA'
    if (periodId.length == 4) {
        return periodId
    }
    if (periodId.length == 6) {
        const year = periodId.slice(0, 4)
        const month = periodId.slice(4, 6)
        return `${year}-${month}`
    }
    if (periodId.length == 5) {
        const year = periodId.slice(0, 4)
        const week = periodId.slice(5, 6)
        return `${year}-W${week}`
    }
}
