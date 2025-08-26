import React, { useEffect, useState } from 'react'
import { Modal } from '@dhis2/ui'
import styles from './ImportPrediction.module.css'

import {
    CrudService,
    PredictionRead,
} from '@dhis2-chap/ui'
import PredictionResult from '../../import-prediction/PredictionResult'

interface ImportPredictionProps {
    setIsImportModalOpen: (value: boolean) => void
    isImportModalOpen: boolean
    predictionIdToImport: string | undefined
}

const ImportPrediction = ({
    isImportModalOpen,
    setIsImportModalOpen,
    predictionIdToImport,
}: ImportPredictionProps) => {
    const [result, setResult] = useState<PredictionRead>()

    //fetch all prediction values
    const fetchPredictionSamples = async (predictionId: number) => {
        await CrudService.getPredictionCrudPredictionsPredictionIdGet(
            predictionId
        ).then((response: any) => {
            setResult(response)
        })
    }

    useEffect(() => {
        if (predictionIdToImport)
            fetchPredictionSamples(Number(predictionIdToImport))
    }, [])

    return (
        <div>
            {isImportModalOpen && (
                <>
                    <Modal
                        className={styles.modal}
                        onClose={() => {
                            setIsImportModalOpen(false)
                        }}
                    >
                        <>
                            {/*show spinner while loading*/}

                            {/*when loaded show results and view to import*/}

                            {/*make a copy of this file in folder features/import-prediction*/}
                            {result && (
                                <PredictionResult
                                    prediction_unprocessed={result}
                                />
                            )}
                        </>
                    </Modal>
                </>
            )}
        </div>
    )
}

export default ImportPrediction
