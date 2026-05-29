import {
    AuthorAssessedStatus,
    ModelSpecRead,
    chap_core__model_spec__PeriodType as PeriodType,
} from '@dhis2-chap/ui';

/**
 * Static, representative model list used purely to prototype model-selector
 * designs without depending on a running CHAP backend. The shape matches
 * `ModelSpecRead` so prototypes can later be wired to `useModels()` unchanged.
 */
export const mockModels: ModelSpecRead[] = [
    {
        id: 1,
        name: 'chap_ewars_monthly',
        displayName: 'EWARS (Monthly)',
        description:
            'Early-warning model for monthly malaria forecasting. Combines climate covariates with historical case counts using a Bayesian hierarchical model.',
        authorAssessedStatus: AuthorAssessedStatus.GREEN,
        author: 'Sarah Nakimuli',
        organization: 'CHAP Core Team',
        organizationLogoUrl: '',
        supportedPeriodType: PeriodType.MONTH,
        authorNote: 'Recommended default for monthly malaria forecasting in most settings.',
        documentationUrl: 'https://chap.example.org/models/ewars-monthly',
        target: { name: 'disease_cases', displayName: 'Malaria cases', description: 'Confirmed malaria cases' },
        covariates: [
            { name: 'rainfall', displayName: 'Rainfall', description: 'Monthly rainfall (mm)' },
            { name: 'mean_temperature', displayName: 'Mean temperature', description: 'Monthly mean temperature' },
        ],
    },
    {
        id: 2,
        name: 'chap_naive_baseline',
        displayName: 'Naive seasonal baseline',
        description:
            'Simple baseline that repeats the seasonal average from previous years. Useful as a reference point when comparing more advanced models.',
        authorAssessedStatus: AuthorAssessedStatus.GREEN,
        author: 'CHAP Core Team',
        organization: 'CHAP Core Team',
        organizationLogoUrl: '',
        supportedPeriodType: PeriodType.MONTH,
        authorNote: 'No Author note yet',
        target: { name: 'disease_cases', displayName: 'Disease cases', description: 'Reported cases' },
        covariates: [],
    },
    {
        id: 3,
        name: 'epimodel_weekly',
        displayName: 'EpiModel (Weekly)',
        description:
            'Weekly compartmental model with climate-driven transmission. Suited for dengue and other vector-borne diseases at fine temporal resolution.',
        authorAssessedStatus: AuthorAssessedStatus.YELLOW,
        author: 'Dr. Liang Wei',
        organization: 'University of Bergen',
        organizationLogoUrl: '',
        supportedPeriodType: PeriodType.WEEK,
        authorNote: 'Validated on two countries; broader testing in progress.',
        documentationUrl: 'https://chap.example.org/models/epimodel-weekly',
        target: { name: 'dengue_cases', displayName: 'Dengue cases', description: 'Confirmed dengue cases' },
        covariates: [
            { name: 'rainfall', displayName: 'Rainfall', description: 'Weekly rainfall (mm)' },
            { name: 'mean_temperature', displayName: 'Mean temperature', description: 'Weekly mean temperature' },
            { name: 'relative_humidity', displayName: 'Relative humidity', description: 'Weekly humidity (%)' },
        ],
    },
    {
        id: 4,
        name: 'arima_climate',
        displayName: 'ARIMA + Climate',
        description:
            'Auto-regressive time-series model augmented with lagged climate covariates. Fast to train and robust for stable, long histories.',
        authorAssessedStatus: AuthorAssessedStatus.YELLOW,
        author: 'Maria Gonzalez',
        organization: 'INSP Mexico',
        organizationLogoUrl: '',
        supportedPeriodType: PeriodType.MONTH,
        authorNote: 'No Author note yet',
        target: { name: 'disease_cases', displayName: 'Disease cases', description: 'Reported cases' },
        covariates: [
            { name: 'rainfall', displayName: 'Rainfall', description: 'Monthly rainfall (mm)' },
        ],
    },
    {
        id: 5,
        name: 'deep_forecaster',
        displayName: 'Deep Forecaster (LSTM)',
        description:
            'Neural sequence model for non-linear outbreak dynamics. Needs longer training histories and benefits from multiple covariates.',
        authorAssessedStatus: AuthorAssessedStatus.ORANGE,
        author: 'Kwame Mensah',
        organization: 'AI4Health Lab',
        organizationLogoUrl: '',
        supportedPeriodType: PeriodType.WEEK,
        authorNote: 'Tuned for high-incidence districts; monitor closely on sparse data.',
        target: { name: 'disease_cases', displayName: 'Disease cases', description: 'Reported cases' },
        covariates: [
            { name: 'rainfall', displayName: 'Rainfall', description: 'Weekly rainfall (mm)' },
            { name: 'mean_temperature', displayName: 'Mean temperature', description: 'Weekly mean temperature' },
            { name: 'population', displayName: 'Population', description: 'District population' },
            { name: 'ndvi', displayName: 'Vegetation index', description: 'Normalised difference vegetation index' },
        ],
    },
    {
        id: 6,
        name: 'gbm_outbreak',
        displayName: 'Gradient Boosted Trees',
        description:
            'Tree-ensemble regressor over engineered climate and lag features. A strong, general-purpose experimental option.',
        authorAssessedStatus: AuthorAssessedStatus.RED,
        author: 'Anita Rao',
        organization: 'CHAP Community',
        organizationLogoUrl: '',
        supportedPeriodType: PeriodType.MONTH,
        authorNote: 'No Author note yet',
        target: { name: 'disease_cases', displayName: 'Disease cases', description: 'Reported cases' },
        covariates: [
            { name: 'rainfall', displayName: 'Rainfall', description: 'Monthly rainfall (mm)' },
            { name: 'mean_temperature', displayName: 'Mean temperature', description: 'Monthly mean temperature' },
        ],
    },
    {
        id: 7,
        name: 'prophet_seasonal',
        displayName: 'Prophet (Seasonal)',
        description:
            'Additive trend-and-seasonality model. Quick to configure for exploratory forecasting where climate drivers are uncertain.',
        authorAssessedStatus: AuthorAssessedStatus.RED,
        author: 'Tomas Berg',
        organization: 'CHAP Community',
        organizationLogoUrl: '',
        supportedPeriodType: PeriodType.MONTH,
        authorNote: 'No Author note yet',
        target: { name: 'disease_cases', displayName: 'Disease cases', description: 'Reported cases' },
        covariates: [],
    },
    {
        id: 8,
        name: 'legacy_regression',
        displayName: 'Legacy linear regression',
        description:
            'Original linear baseline kept for backwards comparison. Superseded by the seasonal baseline and EWARS models.',
        authorAssessedStatus: AuthorAssessedStatus.GRAY,
        author: 'CHAP Core Team',
        organization: 'CHAP Core Team',
        organizationLogoUrl: '',
        supportedPeriodType: PeriodType.MONTH,
        authorNote: 'Deprecated - do not use for new evaluations.',
        target: { name: 'disease_cases', displayName: 'Disease cases', description: 'Reported cases' },
        covariates: [
            { name: 'rainfall', displayName: 'Rainfall', description: 'Monthly rainfall (mm)' },
        ],
    },
];
