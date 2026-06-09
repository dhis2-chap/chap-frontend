import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    IconCheckmarkCircle16,
    IconError16,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui';
import type {
    PredictionImportProgress,
    PredictionImportProgressStep,
} from '../hooks/usePostPredictionData';
import styles from './QuantileMappingForm.module.css';

type Props = {
    clearPreviousValues: boolean;
    isPending: boolean;
    progress: PredictionImportProgress;
    onCancel: () => void;
    onConfirm: () => void;
};

type ImportProgressStepDefinition = {
    id: PredictionImportProgressStep;
    label: string;
};

const getImportProgressSteps = (
    clearPreviousValues: boolean,
): ImportProgressStepDefinition[] => {
    const steps: ImportProgressStepDefinition[] = [
        {
            id: 'validateImport',
            label: i18n.t('Checking import with DHIS2'),
        },
    ];

    if (clearPreviousValues) {
        steps.push(
            {
                id: 'validateClear',
                label: i18n.t('Checking values to clear'),
            },
            {
                id: 'clearPreviousValues',
                label: i18n.t('Clearing previous values'),
            },
        );
    }

    steps.push({
        id: 'importData',
        label: i18n.t('Importing prediction values'),
    });

    return steps;
};

const getProgressStepStatus = (
    step: PredictionImportProgressStep,
    progress: PredictionImportProgress,
) => {
    if (progress.failedStep === step) {
        return 'failed';
    }

    if (progress.completedSteps.includes(step)) {
        return 'complete';
    }

    if (progress.currentStep === step) {
        return 'active';
    }

    return 'waiting';
};

const ImportProgressIcon = ({
    status,
}: {
    status: ReturnType<typeof getProgressStepStatus>;
}) => {
    if (status === 'complete') {
        return <IconCheckmarkCircle16 />;
    }

    if (status === 'failed') {
        return <IconError16 />;
    }

    if (status === 'active') {
        return <span aria-hidden className={styles.importProgressSpinner} />;
    }

    return <span className={styles.importProgressWaitingDot} />;
};

export const ImportConfirmationModal = ({
    clearPreviousValues,
    isPending,
    progress,
    onCancel,
    onConfirm,
}: Props) => {
    const importButtonLabel = clearPreviousValues
        ? i18n.t('Clear and import')
        : i18n.t('Import');
    const confirmationMessage = clearPreviousValues
        ? i18n.t('This will clear existing values for the selected output data elements, then import this prediction into DHIS2.')
        : i18n.t('This will import this prediction into DHIS2 without clearing existing values first.');
    const progressSteps = getImportProgressSteps(clearPreviousValues);

    return (
        <Modal onClose={onCancel} small>
            <ModalTitle>
                {clearPreviousValues ? i18n.t('Clear and import prediction') : i18n.t('Import prediction')}
            </ModalTitle>
            <ModalContent>
                <p>{confirmationMessage}</p>

                <ol
                    className={styles.importProgressList}
                    aria-label={i18n.t('Import progress')}
                >
                    {progressSteps.map((step) => {
                        const status = getProgressStepStatus(step.id, progress);

                        return (
                            <li
                                key={step.id}
                                className={styles.importProgressStep}
                                data-status={status}
                                aria-current={status === 'active' ? 'step' : undefined}
                            >
                                <span className={styles.importProgressIcon}>
                                    <ImportProgressIcon status={status} />
                                </span>
                                <span>{step.label}</span>
                            </li>
                        );
                    })}
                </ol>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onCancel} secondary disabled={isPending}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        loading={isPending}
                        disabled={isPending}
                        primary={!clearPreviousValues}
                        destructive={clearPreviousValues}
                    >
                        {importButtonLabel}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
