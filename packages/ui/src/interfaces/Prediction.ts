import { FullPredictionResponse, PredictionResponse } from '../httpfunctions'

export interface FullPredictionResponseExtended extends FullPredictionResponse {
    diseaseId: string
    dataValues: Array<PredictionResponseExtended>
}

export interface PredictionResponseExtended extends PredictionResponse {
    displayName: string
}
