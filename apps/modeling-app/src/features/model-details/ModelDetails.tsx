import React from 'react'
import { ModelSpecRead } from '@dhis2-chap/ui';
import { Button } from '@dhis2/ui';
import styles from './ModelDetails.module.css'

interface ModelDetailsProps {
    selectedModel: ModelSpecRead
    onChangeModel?: any
}

const ModelDetails = ({ selectedModel, onChangeModel }: ModelDetailsProps) => {

    return (
        <div className={styles.modelDetailsContainer}>
            <div
                key={selectedModel.name}
                className={styles.selectedModelDetails}
            >

                {/* Model Info */}
                <h3 className={styles.modelHumanName}>{selectedModel.displayName}</h3>
                <div className={styles.modelAuthor}>
                    <img src={selectedModel.organizationLogoUrl || "/default-model-logo.png"} alt={selectedModel.name + " logo"} className={styles.modelAuthorLogo} />
                    <span className={styles.modelAuthorName}>
                        {selectedModel.author} - {selectedModel.organization}
                    </span>
                </div>
                <p className={styles.modelDescription}>
                    <div>Description:</div>
                    <div className={styles.modelDescriptionText}>{selectedModel.description || "Coming soon..."}</div>
                </p>

                {/* Covariates */}
                <div className={styles.modelCovariates}>
                    <span>Model inputs:</span>
                    <ul className={styles.modelCovariatesList}>
                        {selectedModel.covariates.map((covariate, index) => (
                            <li key={index} className={styles.modelCovariateItem}>✔ {covariate.name}</li>
                        ))}
                    </ul>
                </div>

                {/* How to cite */}
                <div className={styles.modelCitation}>
                    <span>
                        Attribution:
                    </span>
                    <pre className={styles.modelCitationText}>
                        {selectedModel.citationInfo || "Coming soon..."}
                    </pre>
                </div>

                {/* Source url */}
                <p className={styles.modelLink}>
                    External link: <a href={selectedModel.sourceUrl || ""} target="_blank" rel="noreferrer">{selectedModel.sourceUrl || "http://example.com"}</a>
                </p>

                {/* Contact */}
                <p className={styles.modelEmail}>Contact email: {selectedModel.contactEmail || "Coming soon..."}</p>

                {/* Show change button */}
                {onChangeModel && (
                    <div>
                        <Button
                            onClick={onChangeModel}
                            primary
                        >
                            Change Model
                        </Button>
                    </div>
                )}


            </div>
        </div>
    )
}

export default ModelDetails
