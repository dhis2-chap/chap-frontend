import { z } from 'zod';
import { FeatureType } from '@dhis2-chap/ui';
import { SearchSelectField } from '@/features/search-dataitem/SearchSelectField';
import { toDataTestKey } from '@/utils/dataTestKey';
import styles from './FeatureMappingItem.module.css';
import { dataItemSchema, dimensionItemTypeSchema } from '../../../hooks/useModelExecutionFormState';

type Props = {
    feature: FeatureType;
    onMapping: (
        featureName: string,
        dataItemId: string,
        dataItemDisplayName: string,
        dimensionItemType: z.infer<typeof dimensionItemTypeSchema>,
    ) => void;
    existingMapping?: z.infer<typeof dataItemSchema>;
    onResetField: () => void;
};

export const FeatureMappingItem = ({ feature, onMapping, existingMapping, onResetField }: Props) => {
    const createFeature = (feature: FeatureType) => ({
        id: feature.name || feature.displayName,
        name: feature.displayName,
        displayName: feature.displayName,
        description: feature.description,
    });
    const featureStableId = feature.name || feature.displayName || 'feature';
    const featureDataTestKey = toDataTestKey(featureStableId);

    const shouldShowDescription = (feature: FeatureType) => {
        return feature.description &&
            feature.description.toLowerCase() !== (feature.displayName ?? feature.name).toLowerCase();
    };

    return (
        <div
            className={styles.mappingItem}
            data-test={`feature-mapping-${featureDataTestKey}`}
        >
            <SearchSelectField
                feature={createFeature(feature)}
                onChangeSearchSelectField={(_, dataItemId, dataItemDisplayName, dimensionItemType) => {
                    onMapping(
                        feature.name || feature.displayName,
                        dataItemId,
                        dataItemDisplayName,
                        dimensionItemType,
                    );
                }}
                defaultValue={existingMapping}
                onResetField={onResetField}
                dataTestKey={`feature-mapping-${featureDataTestKey}`}
            />
            {shouldShowDescription(feature) && (
                <p className={styles.featureDescription}>
                    {feature.description}
                </p>
            )}
        </div>
    );
};
