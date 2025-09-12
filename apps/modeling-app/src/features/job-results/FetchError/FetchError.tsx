import React, { useState } from 'react';
import styles from './FetchError.module.css';
import { Button, NoticeBox } from '@dhis2/ui';

interface FetchErrorProps {
    error: string | undefined;
    type: 'predictions' | 'datasets' | 'evaluations' | 'jobs';
}

const FetchError = ({ error, type }: FetchErrorProps) => {
    const [seeDetailOpen, setSeeDetailOpen] = useState(false);

    if (error == undefined) return <></>;

    return (
        <div>
            <NoticeBox
                error
                title={`Unable to retrieve ${type}. Please try again later.`}
                className={styles.noticeBox}
            >
                <div className={styles.button}>
                    <Button
                        small
                        onClick={() => setSeeDetailOpen(!seeDetailOpen)}
                    >
                        {seeDetailOpen ? 'Hide details' : 'See details'}
                    </Button>
                </div>
                {seeDetailOpen && (
                    <div className={styles.details}>
                        <div>{error}</div>
                    </div>
                )}
            </NoticeBox>
        </div>
    );
};

export default FetchError;
