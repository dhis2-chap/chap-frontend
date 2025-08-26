import React, { useState } from 'react'
import styles from './JobResultPanel.module.css'
import { Modal } from '@dhis2/ui'
import ImportPrediction from '../ImportPrediction/ImportPrediction'
import { JobResult } from '../interfaces/JobResult'
import { JobsService, CrudService } from '@dhis2-chap/ui'
import JobResultPanelItem from './JobResultPanelItem/JobResultPanelItem'
import JobLogs from './JobLogs/JobLogs'
import NewEvaluationDrawer from '../../new-evaluation/components/NewEvaluationDrawer'
import EvaluationResult from '../../import-prediction/EvaluationResult'

interface JobResultPanel {
    jobResults: JobResult[]
}

const JobResultPanel = ({ jobResults: jobResults }: JobResultPanel) => {
    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false)
    const [predictionIdToImport, setPredictionToImport] = useState<
        string | undefined
    >(undefined)

    const [newEvaluationDrawerOpen, setNewEvaluationDrawerOpen] =
        useState<boolean>(false)
    const [showEvaluationResultModal, setShowEvaluationResultModal] =
        useState<boolean>(false)
    const [evaluationResultId, setEvaluationResultId] = useState<
        number | undefined
    >(undefined)

    const [datasetIdToEvaluate, setDatasetIdToEvaluate] = useState<
        number | undefined
    >(undefined)

    const [showJobLogs, setShowJobLogs] = useState(false)
    const [jobLogsId, setJobLogsId] = useState<string | undefined>(undefined)

    const onClickImport = (predictionId: string) => {
        setIsImportModalOpen(true)
        setPredictionToImport(predictionId)
    }

    const onClickViewEvaluation = (evaluationId: number) => {
        setShowEvaluationResultModal(true)
        setEvaluationResultId(evaluationId)
    }

    const onClickViewLogs = (jobId: string) => {
        setShowJobLogs(true)
        setJobLogsId(jobId)
    }

    const onClickRemove = (item: JobResult) => {
        const msg =
            'Are you sure you want to permanently remove this item? Any data entries that depend on this item will also be deleted.'
        if (confirm(msg) == true) {
            console.log('Should remove item')
            const dbId = item.result
            if (dbId) {
                if (item.type == 'dataset') {
                    CrudService.deleteDatasetCrudDatasetsDatasetIdDelete(
                        parseInt(dbId)
                    )
                } else if (item.type == 'evaluation') {
                    CrudService.deleteBacktestCrudBacktestsBacktestIdDelete(
                        parseInt(dbId)
                    )
                } else if (item.type == 'prediction') {
                    CrudService.deletePredictionCrudPredictionsPredictionIdDelete(
                        parseInt(dbId)
                    )
                }
            } else {
                const jobId = item.id
                JobsService.deleteJobJobsJobIdDelete(jobId)
            }
        }
    }

    const onClickEvaluateDataset = (datasetId: number | undefined) => {
        console.log('clicked evaluate dataset id', datasetId)
        setDatasetIdToEvaluate(datasetId)
        setNewEvaluationDrawerOpen(true)
    }

    return (
        <>
            {/* add job panel items */}
            {jobResults.map((jobResult: JobResult, i) => (
                <JobResultPanelItem
                    i={i}
                    key={i}
                    jobResult={jobResult}
                    onClickEvaluateDataset={onClickEvaluateDataset}
                    onClickViewEvaluation={onClickViewEvaluation}
                    onClickImport={onClickImport}
                    onClickRemove={onClickRemove}
                    onClickViewLogs={onClickViewLogs}
                />
            ))}

            {/* import modal */}
            {isImportModalOpen && (
                <ImportPrediction
                    setIsImportModalOpen={setIsImportModalOpen}
                    isImportModalOpen={isImportModalOpen}
                    predictionIdToImport={predictionIdToImport}
                />
            )}

            {/* new evaluation drawer */}
            <NewEvaluationDrawer
                isOpen={newEvaluationDrawerOpen}
                setIsOpen={setNewEvaluationDrawerOpen}
                datasetIdToEvaluate={datasetIdToEvaluate}
            />
            {showEvaluationResultModal && evaluationResultId && (
                <Modal
                    className={styles.evaluationModal}
                    onClose={() => {
                        setShowEvaluationResultModal(false)
                    }}
                >
                    <EvaluationResult evaluationId={evaluationResultId} />
                </Modal>
            )}

            {/* job logs modal */}
            {showJobLogs && (
                <Modal
                    className={styles.jobLogsModal}
                    onClose={() => {
                        setShowJobLogs(false)
                    }}
                >
                    <JobLogs jobId={jobLogsId} />
                </Modal>
            )}
        </>
    )
}

export default JobResultPanel
