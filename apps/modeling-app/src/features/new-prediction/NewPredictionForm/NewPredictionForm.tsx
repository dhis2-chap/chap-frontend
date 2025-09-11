import React, { useEffect, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import styles from './NewPredictionForm.module.css';
import { DatasetLayer } from '../../new-dataset/interfaces/DataSetLayer';
import {
    IOrgUnitLevel,
    OrgUnit,
} from '../../orgunit-selector/interfaces/orgUnit';
import { Period } from '../../timeperiod-selector/interfaces/Period';
import { Button, IconCross24, InputField } from '@dhis2/ui';
import SelectDataLine from '../../new-dataset/components/NewDatasetForm/SelectDataLine/SelectDataLine';
import OrgUnitSelector from '../../orgunit-selector/OrgUnitSelector';
import { SendChapData } from '../../send-chap-data/SendChapData';
import TimePeriodeSelector from '../../timeperiod-selector/components/TimePeriodPicker';
import SelectModel from '../../select-model/SelectModel';
import { ModelSpecRead } from '@dhis2-chap/ui';

interface NewPredictionFormProps {
    onDrawerClose: () => void;
    onDrawerSubmit: () => void;
}

const NewPredictionForm = ({
    onDrawerClose,
    onDrawerSubmit,
}: NewPredictionFormProps) => {
    const [dataLayers, setDataLayers] = useState<DatasetLayer[]>([]);

    const [selectedOrgUnits, setSelectedOrgUnits] = useState<OrgUnit[]>([]);
    const [selectedTimePeriodes, setSelectedTimePeriodes] = useState<Period[]>(
        [],
    );
    const [orgUnitLevel, setOrgUnitLevel] = useState<IOrgUnitLevel | undefined>(
        undefined,
    );
    const [datasetName, setDatasetName] = useState<string | undefined>('');
    const [selecetedModel, setSelecetedModel] = useState<
        ModelSpecRead | undefined
    >(undefined);

    // logic for updating dataLayers when model is selected
    useEffect(() => {
        if (selecetedModel == undefined) return;

        const newLayers = selecetedModel.covariates.map((co) => {
            return {
                feature: co.name,
                origin: 'dataItem', // as we are moving away from Chap fetching climate data, set this just to be dataItem 22.04.2025
                dataSource: '',
            } as DatasetLayer;
        });

        setDataLayers(newLayers);
    }, [selecetedModel]);

    const resetDataLayer = (featureName: string) => {
        setDataLayers(prev => prev.filter(layer => layer.feature !== featureName));
    };

    return (
        <>
            <div className={styles.newPredictionForm}>
                <div className={styles.newPredictionTitle}>
                    <h2>New prediction</h2>
                    <Button
                        icon={<IconCross24 />}
                        onClick={onDrawerClose}
                    >
                    </Button>
                </div>
                <div className={styles.formWrapper}>
                    <InputField
                        autoComplete=""
                        label="Name of prediction"
                        value={datasetName}
                        onChange={e => setDatasetName(e.value)}
                        placeholder={i18n.t('Prediction for Northern Province')}
                    />
                    <SelectModel
                        selectedModel={selecetedModel}
                        setSelectedModel={setSelecetedModel}
                    />
                    <SelectDataLine
                        setDataLayers={setDataLayers}
                        datasetLayers={dataLayers}
                        predictMode={true}
                        onResetDataLayer={resetDataLayer}
                    />
                    <TimePeriodeSelector
                        setTimePeriods={setSelectedTimePeriodes}
                    />
                    <OrgUnitSelector
                        orgUnits={selectedOrgUnits}
                        setOrgUnits={setSelectedOrgUnits}
                        orgUnitLevel={orgUnitLevel}
                        setOrgUnitLevel={setOrgUnitLevel}
                    />
                    <SendChapData
                        onDrawerSubmit={onDrawerSubmit}
                        selectedModel={selecetedModel}
                        name={datasetName}
                        dataLayers={dataLayers}
                        onSendAction="predict"
                        orgUnitLevel={orgUnitLevel}
                        selectedPeriodItems={selectedTimePeriodes}
                        selectedOrgUnits={selectedOrgUnits}
                    />
                </div>
            </div>
        </>
    );
};

export default NewPredictionForm;
