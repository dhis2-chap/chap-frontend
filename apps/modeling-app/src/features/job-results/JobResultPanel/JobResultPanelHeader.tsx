import React from 'react';
import styles from './JobResultPanel.module.css';

const PanelHeader = () => {
    return (
        <div>
            <div
                className={[
                    styles.jobResultPanelContainer,
                    styles.resultTextHeader,
                ].join(' ')}
            >
                <div className={styles.flexMedium}>Name:</div>
                <div className={styles.flexMedium}>Created:</div>
                <div className={styles.flexMedium}>Status:</div>
                <div className={styles.flexItemRight}></div>
            </div>
        </div>
    );
};

export default PanelHeader;
