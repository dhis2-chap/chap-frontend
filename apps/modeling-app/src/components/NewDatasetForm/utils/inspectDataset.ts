import i18n from '@dhis2/d2-i18n';
import type { ImportSummaryCorrected } from '../../ModelExecutionForm/types';
import type { PreparedDataset } from './prepareDataset';

// chap-core validates every column except this one for gaps (make-dataset's `validate_full_dataset`).
const TARGET_NAME = 'disease_cases';
// chap-core interpolates gaps in population, so only a location with no population at all is rejected.
const INTERPOLATED_NAME = 'population';

/**
 * Predicts which locations CHAP will reject when it imports this dataset, mirroring the checks
 * chap-core runs in make-dataset, so the data can be checked before anything is saved.
 * CHAP stops at the first incomplete column of a location; this lists all of them, so every
 * gap can be fixed in one go. The locations kept are the same.
 */
export const inspectDataset = ({ request, periods, orgUnits }: PreparedDataset): ImportSummaryCorrected => {
    const observations = request.providedData ?? [];
    const featureNames = [...new Set(observations.flatMap(observation => observation.featureName ?? []))];
    const values = new Map(observations.map(observation => [
        `${observation.orgUnit}|${observation.featureName}|${observation.period}`,
        observation.value,
    ]));

    // CHAP pads every location to the span of periods that appear anywhere in the data.
    const observedIndexes = periods
        .map((period, index) => (observations.some(observation => observation.period === period) ? index : -1))
        .filter(index => index !== -1);
    const span = periods.slice(observedIndexes[0], observedIndexes[observedIndexes.length - 1] + 1);

    const rejected: ImportSummaryCorrected['rejected'] = [];
    let importedCount = 0;

    orgUnits.forEach((orgUnit) => {
        if (!observations.some(observation => observation.orgUnit === orgUnit.id)) {
            rejected.push({ reason: i18n.t('No data for any column'), featureName: i18n.t('All columns'), orgUnit: orgUnit.id, timePeriods: [] });
            return;
        }

        const gaps = featureNames
            .filter(featureName => featureName !== TARGET_NAME)
            .map(featureName => ({
                featureName,
                missing: span.filter(period => values.get(`${orgUnit.id}|${featureName}|${period}`) == null),
            }))
            .filter(({ featureName, missing }) => (
                missing.length && (featureName !== INTERPOLATED_NAME || missing.length === span.length)
            ));

        gaps.forEach(({ featureName, missing }) => rejected.push({
            reason: i18n.t('Missing value for some/all time periods'),
            featureName,
            orgUnit: orgUnit.id,
            timePeriods: missing,
        }));

        if (gaps.length) {
            return;
        }
        if (!orgUnit.hasGeometry) {
            rejected.push({ reason: i18n.t('Missing polygon'), featureName: 'polygon', orgUnit: orgUnit.id, timePeriods: [] });
            return;
        }
        importedCount += 1;
    });

    return { id: null, importedCount, rejected };
};
