
export const getPeriodNameFromId = (periodId : any) => {
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
    if (periodId.length == 5) {
        const year = periodId.slice(0, 4)
        const week = periodId.slice(5, 6)
        return `Week ${week} ${year}`
    }
}

export const getPeriodISOFromId = (periodId : any) => {
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
