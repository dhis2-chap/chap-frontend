import { ObservationBase } from '@dhis2-chap/ui';
import { ModelExecutionFormValues } from '../hooks/useModelExecutionFormState';

export type MissingData = {
    covariate: string;
    orgUnit: string;
    period: string;
};

const normalizePeriod = (period: string): string => {
    if (period.includes('W')) {
        return period.replace(/W0+(\d+)/, 'W$1');
    }

    return period;
};

export const validateClimateData = (
    observations: ObservationBase[],
    formData: ModelExecutionFormValues,
    periods: string[],
    orgUnitIds: string[],
): { isValid: boolean; missingData: MissingData[] } => {
    const missingData: MissingData[] = [];

    const covariateNames = formData.covariateMappings.map(mapping => mapping.covariateName);

    const featureGroups = observations.reduce((acc, obs) => {
        if (obs.featureName && !acc[obs.featureName]) {
            acc[obs.featureName] = [];
        }
        if (obs.featureName) {
            acc[obs.featureName].push(obs);
        }
        return acc;
    }, {} as Record<string, ObservationBase[]>);

    covariateNames.forEach((covariateName) => {
        const covariateData = featureGroups[covariateName] || [];

        const existingCombinations = new Set(
            covariateData
                .map(d => `${normalizePeriod(d.period)}-${d.orgUnit}`),
        );

        periods.forEach((period) => {
            orgUnitIds.forEach((orgUnit) => {
                const combinationKey = `${normalizePeriod(period)}-${orgUnit}`;
                if (!existingCombinations.has(combinationKey)) {
                    missingData.push({
                        covariate: covariateName,
                        orgUnit: orgUnit,
                        period: period,
                    });
                }
            });
        });
    });

    return {
        isValid: missingData.length === 0,
        missingData,
    };
};
