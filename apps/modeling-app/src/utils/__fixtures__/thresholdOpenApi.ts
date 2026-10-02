// Threshold endpoint excerpt from the CHAP Core OpenAPI contract.
export const thresholdOpenApi = {
    paths: {
        '/v1/analytics/thresholds': {
            post: {
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ThresholdRequest',
                            },
                        },
                    },
                    required: true,
                },
            },
        },
    },
    components: {
        schemas: {
            ThresholdRequest: {
                properties: {
                    datasetId: {
                        type: 'integer',
                        title: 'Datasetid',
                        description: 'Primary key of the dataset to compute thresholds from.',
                    },
                    periodIds: {
                        items: {
                            type: 'string',
                        },
                        type: 'array',
                        title: 'Periodids',
                        description: 'Periods to produce thresholds for, e.g. `["2024-01", "2024-02"]`.',
                    },
                    locations: {
                        anyOf: [
                            {
                                items: {
                                    type: 'string',
                                },
                                type: 'array',
                            },
                            {
                                type: 'null',
                            },
                        ],
                        title: 'Locations',
                        description: 'Optional locations to restrict the result to. When omitted or empty, every location in the dataset is returned.',
                    },
                    params: {
                        oneOf: [
                            {
                                $ref: '#/components/schemas/SeasonalParams',
                            },
                            {
                                $ref: '#/components/schemas/PercentileParams',
                            },
                        ],
                        title: 'Params',
                        description: 'Strategy-specific parameters; the `type` field selects the strategy.',
                        discriminator: {
                            propertyName: 'type',
                            mapping: {
                                percentile: '#/components/schemas/PercentileParams',
                                seasonal: '#/components/schemas/SeasonalParams',
                            },
                        },
                    },
                },
                type: 'object',
                required: [
                    'datasetId',
                    'periodIds',
                    'params',
                ],
                title: 'ThresholdRequest',
                description: 'Request body for computing thresholds (endemic channel) for a dataset.',
            },
            SeasonalParams: {
                properties: {
                    type: {
                        type: 'string',
                        const: 'seasonal',
                        title: 'Type',
                    },
                    stdMultiplier: {
                        anyOf: [
                            {
                                type: 'number',
                            },
                            {
                                items: {
                                    type: 'number',
                                },
                                type: 'array',
                                minItems: 1,
                            },
                        ],
                        title: 'Stdmultiplier',
                        description: 'Number of standard deviations above the seasonal mean. A list produces one threshold line per entry.',
                        default: 2.0,
                    },
                },
                type: 'object',
                required: [
                    'type',
                ],
                title: 'SeasonalParams',
                description: 'Parameters for the seasonal mean + k*std strategy.',
            },
            PercentileParams: {
                properties: {
                    type: {
                        type: 'string',
                        const: 'percentile',
                        title: 'Type',
                    },
                    quantile: {
                        anyOf: [
                            {
                                type: 'number',
                                maximum: 1.0,
                                minimum: 0.0,
                            },
                            {
                                items: {
                                    type: 'number',
                                    maximum: 1.0,
                                    minimum: 0.0,
                                },
                                type: 'array',
                                minItems: 1,
                            },
                        ],
                        title: 'Quantile',
                        description: 'Percentile of historical same-season values, as a fraction in [0, 1]. A list produces one threshold line per entry, e.g. `[0.25, 0.75]` for the endemic channel band.',
                        default: 0.75,
                    },
                    baselineYears: {
                        anyOf: [
                            {
                                type: 'integer',
                                minimum: 1.0,
                            },
                            {
                                type: 'null',
                            },
                        ],
                        title: 'Baselineyears',
                        description: 'Number of the most recent complete years in the dataset to compute the baseline from. A partial final year is excluded. `null` uses all available history.',
                        default: 5,
                    },
                },
                type: 'object',
                required: [
                    'type',
                ],
                title: 'PercentileParams',
                description: 'Parameters for the seasonal percentile (WHO endemic channel) strategy.',
            },
        },
    },
};
