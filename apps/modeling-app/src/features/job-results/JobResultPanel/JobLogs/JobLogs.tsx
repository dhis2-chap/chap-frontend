import React, { useState, useEffect, useRef } from 'react';
import { JobsService } from '@dhis2-chap/ui';
import styles from './JobLogs.module.css';
import usePolling from '../../../../hooks/usePolling';

interface JobLogsProps {
    jobId: string | undefined;
}

const JobLogs = ({ jobId }: JobLogsProps) => {
    const [logs, setLogs] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const logRef = useRef<HTMLPreElement>(null);

    const fetchLogs = async () => {
        if (!jobId) return;
        console.log('fetching logs');
        try {
            const logText = await JobsService.getLogsJobsJobIdLogsGet(jobId);
            setLogs(logText);
        } catch (err: any) {
            setError(err.body.detail);
        } finally {
            setLoading(false);
        }
    };

    // fetch initial logs
    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchLogs();
    }, [jobId]);

    // scroll logs window every time logs update
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    // trigger job pulling every X seconds
    usePolling(fetchLogs, 5000);

    if (!jobId) return <p>No job ID provided.</p>;
    if (loading) return <p>Loading logs...</p>;
    if (error) return (
        <p className={styles.error}>
            Error:
            {error}
        </p>
    );

    return (
        <div className={styles.jobLogs}>
            <h2>Job Logs</h2>
            <pre className={styles.logContent} ref={logRef}>
                {logs || '<No logs reported for this job>'}
            </pre>
        </div>
    );
};

export default JobLogs;
