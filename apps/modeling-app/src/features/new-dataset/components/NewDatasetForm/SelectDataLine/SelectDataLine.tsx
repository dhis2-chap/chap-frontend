import {
    SingleSelectField,
    SingleSelectOption,
    SingleSelectProps,
} from '@dhis2/ui';
import React, { useEffect, useState } from 'react';
import styles from './SelectDataLine.module.css';
import { DatasetLayer } from '../../../interfaces/DataSetLayer';
import { AnalyticsService, DataSource } from '@dhis2-chap/ui';
import SearchSelectField from '../../../../search-dataitem/SearchSelectField';
import { features } from '../NewDatasetForm';

interface SelectDataLineProps {
    setDataLayers: (datasetLayer: DatasetLayer[]) => void;
    datasetLayers: DatasetLayer[];
    predictMode?: boolean;
    onResetDataLayer: (featureName: string) => void;
}

/// temporarily dummy data

const SelectDataLine = ({
    datasetLayers,
    setDataLayers,
    predictMode,
    onResetDataLayer,
}: SelectDataLineProps) => {
    const [chapSources, setChapSources] = useState<DataSource[]>([]);

    const fetchChapSources = async () => {
        await AnalyticsService.getDataSourcesAnalyticsDataSourcesGet().then(
            (response) => {
                setChapSources(response);
            },
        );
    };

    useEffect(() => {
        fetchChapSources();
    }, []);

    const onChangeClickSelectField = (
        e: SingleSelectProps,
        type: 'feature' | 'origin' | 'dataSource',
        index: number,
    ) => {
        const newDataSetLayer = [...datasetLayers];
        if (e.selected == undefined) return;
        // when type is origin, simitainously wipe Data source
        if (type === 'origin') {
            newDataSetLayer[index]['dataSource'] = '';
        }
        if (type === 'feature') {
            newDataSetLayer[index]['dataSource'] = '';
        }

        ; (newDataSetLayer[index] as any)[type] = e.selected;
        setDataLayers(newDataSetLayer);
    };

    // temp create e method, converting search field output to match format used in this file
    const onChangeSearchSelectField = (dataItemId: string, index: number) => {
        // find index
        const selected = { selected: dataItemId };
        onChangeClickSelectField(selected, 'dataSource', index);
    };

    return (
        <div>
            <h3>Covariates</h3>
            {/*
            //not needed as Chap is not fetching climate data anymore

            <NoticeBox title="Origin">
                The modeling app supports direct retrieval of the ERA5-Land data
                without the need of the DHIS2 Climate App. If you are using an
                ERA5-Land source, we recommend utilizing this direct retrieval
                method by selecting the "ERA5-Land" origin. For local data
                sources or the CHIRPS dataset, please select DHIS2 as the
                origin, and then choose the specific data element where the data
                has been imported.
            </NoticeBox> */}

            <div className={styles.selectDataLineWrapper}>
                {datasetLayers.map((dataLayer, index) => (
                    <div key={index}>
                        <div className={styles.dataLineWrapper}>
                            {predictMode ? (
                                <div className={styles.predictLabel}>
                                    {features.filter(
                                        f => f.id === dataLayer.feature,
                                    )[0]?.name + ':'}
                                </div>
                            ) : (
                                <div className={styles.predictLabel}>
                                    {features.filter(
                                        f => f.id === dataLayer.feature,
                                    )[0]?.name + ':'}

                                    {/* <div className={styles.selectField}>
                                    <SingleSelectField
                                        label="Covariate"
                                        onChange={(e) =>
                                            onChangeClickSelectField(
                                                e,
                                                'feature',
                                                index
                                            )
                                        }
                                        selected={dataLayer.feature}
                                    >
                                        {getNonSelectedFeatures(index).map(
                                            (f) => (
                                                <SingleSelectOption
                                                    key={f.id}
                                                    label={f.name}
                                                    value={f.id}
                                                />
                                            )
                                        )}
                                    </SingleSelectField>
                                </div> */}
                                </div>
                            )}
                            {/* <div className={styles.selectField}>
                                <SingleSelectField
                                    disabled={dataLayer.feature === ''}
                                    label="Origin"
                                    onChange={(e) =>
                                        onChangeClickSelectField(
                                            e,
                                            'origin',
                                            index
                                        )
                                    }
                                    selected={dataLayer.origin}
                                >
                                    {chapSources.some((source) =>
                                        source.supportedFeatures.includes(
                                            dataLayer.feature
                                        )
                                    ) && (
                                        <SingleSelectOption
                                            label={'ERA5-Land'}
                                            value={'CHAP'}
                                        />
                                    )}
                                    <SingleSelectOption
                                        label={'DHIS2'}
                                        value={'dataItem'}
                                    />
                                </SingleSelectField>
                            </div> */}
                            <div className={styles.selectField}>
                                {(dataLayer.origin === 'CHAP'
                                    || dataLayer.origin === '') && (
                                    <SingleSelectField
                                        disabled={dataLayer.origin === ''}
                                        label="Data Element"
                                        onChange={e =>
                                            onChangeClickSelectField(
                                                e,
                                                'dataSource',
                                                index,
                                            )}
                                        selected={dataLayer.dataSource}
                                    >
                                        {chapSources.map(
                                            (de: DataSource) =>
                                            // if feature is the same type as the Feature selected
                                                de.supportedFeatures.includes(
                                                    dataLayer.feature,
                                                ) && (
                                                    <SingleSelectOption
                                                        key={de.name}
                                                        label={`${de.dataset.toUpperCase()} - ${de.displayName
                                                        }`}
                                                        value={de.dataset}
                                                    />
                                                ),
                                        )}
                                    </SingleSelectField>
                                )}
                                {dataLayer.origin === 'dataItem' && (
                                    <SearchSelectField
                                        feature={{
                                            name: features.filter(
                                                f =>
                                                    f.id === dataLayer.feature,
                                            )[0]?.name,
                                            id: dataLayer.feature,
                                            description: '',
                                            displayName: features.filter(
                                                f =>
                                                    f.id === dataLayer.feature,
                                            )[0]?.name || '',
                                        }}
                                        onChangeSearchSelectField={(
                                            e,
                                            dataItemId,
                                        ) =>
                                            onChangeSearchSelectField(
                                                dataItemId,
                                                index,
                                            )}
                                        onResetField={() => onResetDataLayer(dataLayer.feature)}
                                    />
                                )}
                            </div>
                            {/*! predictMode && (
                                <div>
                                    <Button
                                        onClick={() => removeLayer(index)}
                                        destructive
                                        large
                                        icon={<IconDelete24 />}
                                    ></Button>
                                </div>
                            ) */}
                        </div>
                    </div>
                ))}
                {/*! predictMode && (
                    <div className={styles.buttonRight}>
                        <Button onClick={addLayer} icon={<IconAdd16 />}>
                            Add layer
                        </Button>
                    </div>
                ) */}
            </div>
        </div>
    );
};

export default SelectDataLine;
