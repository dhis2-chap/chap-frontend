import React, { useEffect, useState } from 'react'
import { CrudService, ModelSpecRead } from '@dhis2-chap/ui';
import { Button } from '@dhis2/ui';
import ModelDetails from '../model-details/ModelDetails'
import styles from './SelectModel.module.css'

interface SelectModelProps {
    selectedModel: ModelSpecRead | undefined
    setSelectedModel: (m: ModelSpecRead | undefined) => void
}

const offlineModel: ModelSpecRead = {
    name: "Download data (CHAP is offline)",
    id: 0,
    description: "Download data from the CHAP API",
    displayName: "",
    covariates: [],
    target: {
        name: "target",
        description: "target",
        displayName: ''
    }
}

const SelectModel = ({ selectedModel, setSelectedModel }: SelectModelProps) => {

    const [models, setModels] = useState<ModelSpecRead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showGrid, setShowGrid] = useState(true); // Control grid visibility

    const getModels = async () => {
        await CrudService.listModelsCrudModelsGet()

            .then((response: ModelSpecRead[]) => {
                //turn target_name into a feature
                const models: ModelSpecRead[] = response.map((d: ModelSpecRead) => {
                    d.covariates = d.covariates.concat(d.target)
                    return d
                })
                setIsLoading(false)
                setModels(models)

            }).catch(() => {
                //route probarly not set up, warning should be shown
                setModels([offlineModel])
                setSelectedModel(offlineModel)
                setIsLoading(false)
            })
    }

    const onChangeModel = (selected: ModelSpecRead) => {
        setSelectedModel(selected)
        setShowGrid(false); // Collapse grid after selection
    }

    useEffect(() => {
        getModels()
    }, [])

    return (
        <div className={styles.modelSelectContainer}>

            {isLoading ? (
                <p>Loading models...</p>
            ) : (
                <>
                    <h3>Prediction Model</h3>

                    {/* Show selected model when grid is collapsed */}
                    {!showGrid && selectedModel && (
                        <div>
                            <ModelDetails selectedModel={selectedModel} onChangeModel={() => setShowGrid(true)} />
                        </div>
                    )}

                    {/* Show model grid when selecting */}
                    {showGrid && (
                        <div>
                            <div className={styles.modelGrid}>
                                {models
                                    //.filter((model) => model.name !== selectedModel?.name) // Exclude selected model
                                    .map((model) => (
                                        <div
                                            key={model.name}
                                            className={`${styles.modelCard} ${selectedModel?.name === model.name ? styles.selectedModelCard : ""}`}
                                        >
                                            {/* Model Info */}
                                            <h3 className={styles.modelHumanName}>{model.displayName}</h3>
                                            <div className={styles.modelAuthor}>
                                                <img src={model.organizationLogoUrl || "/default-model-logo.png"} alt={model.name + " logo"} className={styles.modelAuthorLogo} />
                                                <span className={styles.modelAuthorName}>{model.author} - {model.organization}</span>
                                            </div>

                                            {/* Covariates */}
                                            <ul className={styles.modelCovariatesList}>
                                                {model.covariates.map((covariate, index) => (
                                                    <li key={index} className={styles.modelCovariateItem}>✔ {covariate.name}</li>
                                                ))}
                                            </ul>

                                            {/* Select Button */}
                                            <Button
                                                onClick={() => onChangeModel(model)}
                                                primary
                                            >
                                                {selectedModel?.name === model.name ? "Selected" : "Select Model"}
                                            </Button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SelectModel