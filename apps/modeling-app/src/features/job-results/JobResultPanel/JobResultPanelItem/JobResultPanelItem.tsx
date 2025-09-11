import React, { useState, useRef } from 'react';
import { ConditionalTooltip } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './JobResultPanelItem.module.css';
import {
    Button,
    IconDelete24,
    IconArchive24,
    IconVisualizationAreaStacked24,
    IconLaunch24,
    IconRuler24,
    IconMore16,
    Menu,
    MenuItem,
    Popper,
} from '@dhis2/ui';
import { JobResult } from '../../interfaces/JobResult';
import { useClickOutside } from '../../../../hooks/useClickOutside';
interface JobResultPanelItem {
    i: number;
    jobResult: JobResult;
    onClickImport: any;
    onClickEvaluateDataset: any;
    onClickViewEvaluation: any;
    onClickViewLogs: any;
    onClickRemove: any;
}

const JobResultPanelItem = ({
    i,
    jobResult: jobResult,
    onClickEvaluateDataset,
    onClickViewEvaluation,
    onClickImport,
    onClickViewLogs,
    onClickRemove,
}: JobResultPanelItem) => {
    const [showMenu, setShowMenu] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside menu or button
    useClickOutside(menuRef, (event) => {
        // Only close if clicked outside the menu and not on the trigger
        if (!buttonRef.current?.contains(event.target as Node)) {
            setShowMenu(false);
        }
    });

    const getStatusColor = (status: string | undefined) => {
        switch (status) {
            case 'STARTED':
                return styles.inProgress;
            case 'PENDING':
                return styles.notStarted;
            case 'FAILURE':
                return styles.failed;
            default:
                return styles.completed;
        }
    };

    const getStatusText = (status: string | undefined) => {
        switch (status) {
            case 'STARTED':
                return 'In progress..';
            case 'PENDING':
                return 'Pending..';
            case 'FAILURE':
                return 'Failed';
            default:
                return 'Completed';
        }
    };

    return (
        <div key={i} className={styles.boxPanel}>
            <div className={styles.jobResultPanelContainer}>
                <div className={styles.flexMedium}>{jobResult.name}</div>
                <div className={styles.flexMedium}>
                    {jobResult.created.toDateString()
                        + ', '
                        + jobResult.created.toLocaleTimeString().slice(0, 5)}
                </div>
                <div className={styles.flexMedium}>
                    <span className={getStatusColor(jobResult.status)}>
                        {getStatusText(jobResult.status)}
                    </span>
                </div>
                <div className={styles.flexItemRight}>
                    {
                        {
                            prediction: (
                                <>
                                    {jobResult.status == 'SUCCESS' && (
                                        <Button
                                            icon={<IconLaunch24 />}
                                            onClick={() =>
                                                onClickImport(jobResult.result)}
                                            small
                                        >
                                            Import
                                        </Button>
                                    )}
                                </>
                            ),
                            dataset: (
                                <>
                                    {jobResult.status == 'SUCCESS' && (
                                        <Button
                                            icon={<IconRuler24 />}
                                            onClick={() =>
                                                onClickEvaluateDataset(
                                                    jobResult.result,
                                                )}
                                            small
                                        >
                                            Evaluate
                                        </Button>
                                    )}
                                </>
                            ),
                            evaluation: (
                                <>
                                    {jobResult.status == 'SUCCESS' && (
                                        <Button
                                            icon={
                                                <IconVisualizationAreaStacked24 />
                                            }
                                            onClick={() =>
                                                onClickViewEvaluation(
                                                    jobResult.result,
                                                )}
                                            small
                                        >
                                            View
                                        </Button>
                                    )}
                                </>
                            ),
                        }[jobResult.type]
                    }

                    {jobResult.status != 'SUCCESS' && (
                        <Button
                            icon={<IconArchive24 />}
                            onClick={() => onClickViewLogs(jobResult.id)}
                            small
                        >
                            Logs
                        </Button>
                    )}

                    <div ref={buttonRef}>
                        <ConditionalTooltip
                            enabled={jobResult.status === 'STARTED'}
                            content={i18n.t(
                                'Job is still running. Please wait until it is finished before doing any actions.',
                            )}
                        >
                            <Button
                                small
                                icon={<IconMore16 />}
                                disabled={jobResult.status === 'STARTED'}
                                onClick={() => setShowMenu(prev => !prev)}
                            />
                        </ConditionalTooltip>
                    </div>

                    {showMenu && (
                        <Popper reference={buttonRef} placement="top-end">
                            <div ref={menuRef} className={styles.popupMenuDiv}>
                                <Menu>
                                    {['SUCCESS', 'FAILURE'].includes(
                                        jobResult.status,
                                    ) && (
                                        <MenuItem
                                            label="Delete"
                                            icon={<IconDelete24 />}
                                            destructive
                                            onClick={() => {
                                                setShowMenu(false);
                                                onClickRemove(jobResult);
                                            }}
                                        />
                                    )}
                                </Menu>
                            </div>
                        </Popper>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobResultPanelItem;
