import { Button, IconAdd24, IconArrowRight24, IconDownload24 } from '@dhis2/ui';
import React from 'react';
import styles from './SendOrDownloadButtons.module.css';

interface SendOrDownloadButtonsProps {
    startDownload: {
        startDownload: boolean;
        action: 'predict' | 'new-dataset' | 'download';
    };
    isSendingDataToChap: boolean;
    orgUnits: any[];
    onClickDownloadOrPostData: (
        action: 'predict' | 'new-dataset' | 'download'
    ) => void;
    formValid: boolean;
    onButtonSendAction: 'predict' | 'new-dataset';
}

const SendOrDownloadButtons = ({
    startDownload,
    isSendingDataToChap,
    formValid: isValid,
    orgUnits,
    onClickDownloadOrPostData,
    onButtonSendAction,
}: SendOrDownloadButtonsProps) => {
    const orgUnitsSelectedIsValid = () => {
        if (orgUnits.length === 0) {
            return true;
        }

        const firstElement = (orgUnits[0] as any).path.split('/').length;
        return orgUnits.every(
            (innerArray: any) =>
                (innerArray as any).path.split('/').length === firstElement,
        );
    };

    const rightButtonText =
        onButtonSendAction === 'predict' ? 'Send prediction' : 'Create dataset';
    const icon =
        onButtonSendAction === 'predict' ? <IconArrowRight24 /> : <IconAdd24 />;

    return (
        <div>
            <div className={styles.buttons}>
                <Button
                    icon={<IconDownload24 />}
                    loading={
                        startDownload.startDownload &&
                        startDownload.action === 'download'
                    }
                    disabled={
                        !isValid
                        || startDownload.startDownload
                        || !orgUnitsSelectedIsValid()
                    }
                    onClick={() => onClickDownloadOrPostData('download')}
                >
                    Download data
                </Button>
                <Button
                    icon={icon}
                    primary
                    loading={
                        (startDownload.startDownload &&
                            startDownload.action === onButtonSendAction)
                        || isSendingDataToChap
                    }
                    disabled={
                        !isValid
                        || startDownload.startDownload
                        || !orgUnitsSelectedIsValid()
                    }
                    onClick={() =>
                        onClickDownloadOrPostData(onButtonSendAction)}
                >
                    {rightButtonText}
                </Button>
            </div>
            {isSendingDataToChap && (
                <p className={styles.text}>Sending data..</p>
            )}
        </div>
    );
};

export default SendOrDownloadButtons;
