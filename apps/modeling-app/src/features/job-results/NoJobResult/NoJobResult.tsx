import React from 'react';
import styles from './NoJobResult.module.css';

interface NoJobResultProps {
    type: 'predictions' | 'datasets' | 'evaluations' | 'job';
}

export const NoJobResult = ({ type }: NoJobResultProps) => {
    return (
        <div className={styles.text}>
            No
            {type}
            {' '}
            found
        </div>
    );
};
