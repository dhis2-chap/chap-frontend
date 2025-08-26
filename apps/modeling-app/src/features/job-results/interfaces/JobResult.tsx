export interface JobResult {
    id: string
    status: string
    type: 'prediction' | 'dataset' | 'evaluation'
    name: string
    created: Date

    result?: string | undefined

    datasetId?: number
    estimatorId?: string
    nPeriods?: number

    description?: string
    hostname?: string
}
