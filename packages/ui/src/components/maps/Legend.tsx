import React from 'react';
import styles from './Legend.module.css';

const Legend = ({ title, bins, colors }: any) => {
    console.log('Legend:', bins, colors);
    return (
        <div className={styles.legend}>
            <br></br>
            <div className={styles.legendTitle}>{title}</div>
            <div className={styles.legendSymbols}>
                {bins.map((bin: any, index: number) => {
                    return (
                        <div className={styles.classItem} key={index}>
                            <span
                                className={styles.classSymbol}
                                style={{ backgroundColor: colors[index] }}
                            >
                            </span>
                            <span className={styles.classLabel}>
                                {bin.startValue}
                                {' '}
                                -
                                {bin.endValue}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Legend;
