import React from 'react'
import { FeatureType } from '@dhis2-chap/ui'
import SearchSelectField from '../../../../../features/search-dataitem/SearchSelectField'
import styles from './FeatureMappingItem.module.css'

type Props = {
    feature: FeatureType
    onMapping: (featureName: string, dataItemId: string) => void
}

export const FeatureMappingItem = ({ feature, onMapping }: Props) => {
    const createFeature = (feature: FeatureType) => ({
        id: feature.name || feature.displayName,
        name: feature.displayName,
        displayName: feature.displayName,
        description: feature.description,
    })

    const shouldShowDescription = (feature: FeatureType) => {
        return feature.description
            && feature.description.toLowerCase() !== (feature.displayName ?? feature.name).toLowerCase()
    }

    return (
        <div className={styles.mappingItem}>
            <SearchSelectField
                feature={createFeature(feature)}
                onChangeSearchSelectField={(_, dataItemId) => {
                    onMapping(
                        feature.name || feature.displayName,
                        dataItemId
                    )
                }}
            />
            {shouldShowDescription(feature) && (
                <p className={styles.featureDescription}>
                    {feature.description}
                </p>
            )}
        </div>
    )
} 