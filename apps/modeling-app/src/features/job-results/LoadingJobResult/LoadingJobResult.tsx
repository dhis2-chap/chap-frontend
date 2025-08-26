import React from 'react'
import styles from './LoadingJobResult.module.css'
import { CircularLoader } from '@dhis2/ui'

interface LoadingJobResultProps {
    type: 'predictions' | 'datasets' | 'evaluations'
}

const LoadingJobResult = ({ type }: LoadingJobResultProps) => {
    return (
        <>
            <div className={styles.loaderWrapper}>
                <div className={styles.loader}>
                    <CircularLoader />
                </div>
            </div>
            <p className={styles.textLoad}>
                <i>Loading {type}</i>
            </p>
        </>
    )
}

export default LoadingJobResult
