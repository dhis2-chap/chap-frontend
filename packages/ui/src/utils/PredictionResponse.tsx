//these functions are used to get the prediction response from the server to display them in the view, add orgUnits names and so on

import { PredictionResponseExtended } from '../interfaces/Prediction'

export const getUniqePeriods = (
    values: Array<PredictionResponseExtended>
): string[] => {
    return [...new Set(values.map((v: PredictionResponseExtended) => v.period))]
}

export const getUniqeOrgUnits = (
    values: Array<PredictionResponseExtended>
): string[] => {
    return [
        ...new Set(values.map((v: PredictionResponseExtended) => v.orgUnit)),
    ]
}

export const getUniqeQuantiles = (
    values: Array<PredictionResponseExtended>
): string[] => {
    return [
        ...new Set(
            values.map((v: PredictionResponseExtended) => v.dataElement)
        ),
    ]
}

export const findOrgUnitName = (
    orgUnitId: string,
    values: Array<PredictionResponseExtended>
) => {
    return values.find(
        (ou: PredictionResponseExtended) => ou.orgUnit === orgUnitId
    )?.displayName
}
