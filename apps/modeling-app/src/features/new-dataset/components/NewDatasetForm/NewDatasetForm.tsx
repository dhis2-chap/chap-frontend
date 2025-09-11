import React, { useState } from 'react';
import styles from './NewDatasetForm.module.css';
import { DatasetLayer } from '../../interfaces/DataSetLayer';
import { InputField } from '@dhis2/ui';
import TimePeriodeSelector from '../../../timeperiod-selector/components/TimePeriodPicker';
import OrgUnitSelector from '../../../orgunit-selector/OrgUnitSelector';
import { Feature } from '@dhis2-chap/ui';
import { SendChapData } from '../../../send-chap-data/SendChapData';
import { IOrgUnitLevel, OrgUnit } from '../../../orgunit-selector/interfaces/orgUnit';
import SelectDataLine from './SelectDataLine/SelectDataLine';
import { Period } from '../../../timeperiod-selector/interfaces/Period';

interface NewDatasetFormProps {
    onDrawerSubmit: () => void;
}

export const features: Feature[] = [
    {
        id: 'rainfall',
        name: 'Rainfall',
        description: 'The amount of rainfall in mm',
        optional: true,
    },
    {
        id: 'mean_temperature',
        name: 'Mean Temperature',
        description: 'The average temperature in degrees Celsius',
        optional: true,
    },
    {
        id: 'population',
        name: 'Population',
        description: 'The population of the area',
        optional: false,
    },

    { name: 'Disease cases', id: 'disease_cases', description: 'Feature 5' },
];

const fromFeatureToDataSetLayer = () => {
    const dataSetLayer: DatasetLayer[] = features.map((feature) => {
        return {
            feature: feature.id,
            origin: 'dataItem',
            dataSource: '', // This will be set later
        };
    });
    return dataSetLayer;
};

const NewDatasetForm = ({ onDrawerSubmit }: NewDatasetFormProps) => {
    const [dataLayers, setDataLayers] = useState<DatasetLayer[]>(
        fromFeatureToDataSetLayer(),
    );
    const [selectedOrgUnits, setSelectedOrgUnits] = useState<OrgUnit[]>([]);
    const [selectedTimePeriodes, setSelectedTimePeriodes] = useState<Period[]>(
        [],
    );
    const [orgUnitLevel, setOrgUnitLevel] = useState<IOrgUnitLevel | undefined>(
        undefined,
    );
    const [datasetName, setDatasetName] = useState<string | undefined>('');

    const resetDataLayer = (featureName: string) => {
        setDataLayers(prev => prev.filter(layer => layer.feature !== featureName));
    };

    return (
        <>
            <div className={styles.formWrapper}>
                <InputField
                    autoComplete=""
                    label="Dataset name"
                    value={datasetName}
                    onChange={e => setDatasetName(e.value)}
                    helpText="Name your dataset"
                    placeholder="Example: Monthly malaria cases, ERA5 climate data, all districts"
                />
                <SelectDataLine
                    setDataLayers={setDataLayers}
                    datasetLayers={dataLayers}
                    onResetDataLayer={resetDataLayer}
                />
                <TimePeriodeSelector setTimePeriods={setSelectedTimePeriodes} />
                <OrgUnitSelector
                    orgUnits={selectedOrgUnits}
                    setOrgUnits={setSelectedOrgUnits}
                    orgUnitLevel={orgUnitLevel}
                    setOrgUnitLevel={setOrgUnitLevel}
                />
                <SendChapData
                    onDrawerSubmit={onDrawerSubmit}
                    name={datasetName}
                    dataLayers={dataLayers}
                    onSendAction="new-dataset"
                    orgUnitLevel={orgUnitLevel}
                    selectedPeriodItems={selectedTimePeriodes}
                    selectedOrgUnits={selectedOrgUnits}
                />
            </div>
        </>
    );
};

export default NewDatasetForm;
