import React, { useState } from 'react';
import { Button, ButtonStrip } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useNavigate } from 'react-router-dom';
import { Widget } from '@dhis2-chap/ui';
import { CopyBacktestModal } from '../../../BacktestsTable/BacktestActionsMenu/CopyBacktestModal';
import styles from './QuickActionsWidget.module.css';

type Props = {
    evaluationId: number;
};

export const QuickActionsWidgetComponent = ({ evaluationId }: Props) => {
    const navigate = useNavigate();
    const [copyModalIsOpen, setCopyModalIsOpen] = useState(false);
    const [open, setOpen] = useState(true);

    const handleCompareWith = () => {
        navigate(`/evaluate/compare?baseEvaluation=${evaluationId}`);
    };

    const handleCreateNew = () => {
        setCopyModalIsOpen(true);
    };

    return (
        <>
            <Widget
                header={i18n.t('Quick actions')}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            >
                <div className={styles.content}>
                    <ButtonStrip>
                        <Button
                            onClick={handleCompareWith}
                            dataTest="quick-action-compare"
                        >
                            {i18n.t('Compare with...')}
                        </Button>
                        <Button
                            onClick={handleCreateNew}
                            dataTest="quick-action-create-new"
                        >
                            {i18n.t('Create new')}
                        </Button>
                    </ButtonStrip>
                </div>
            </Widget>

            {copyModalIsOpen && (
                <CopyBacktestModal
                    id={evaluationId}
                    onClose={() => setCopyModalIsOpen(false)}
                />
            )}
        </>
    );
};
