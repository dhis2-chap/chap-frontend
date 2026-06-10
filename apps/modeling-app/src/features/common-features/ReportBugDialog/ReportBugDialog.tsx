import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { useAlert, useConfig } from '@dhis2/app-runtime';
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui';
import {
    IconCheckmark16,
    IconCopy16,
    IconMail16,
} from '@dhis2/ui-icons';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useRoute } from '../../../hooks/useRoute';
import { useChapStatus } from '../../settings/ChapSettings/hooks/useChapStatus';
import styles from './ReportBugDialog.module.css';

export const REPORT_EMAIL = 'chap@dhis2.org';

const getCurrentHashRoute = () => {
    if (typeof window === 'undefined') {
        return i18n.t('Unknown page');
    }

    const hashRoute = window.location.hash.replace(/^#/, '').split('?')[0];

    return hashRoute || i18n.t('Unknown page');
};

type ReportTemplateProps = {
    chapVersion: string;
    dhis2Version: string;
    modelingAppVersion: string;
};

const createReportTemplate = ({
    chapVersion,
    dhis2Version,
    modelingAppVersion,
}: ReportTemplateProps) => [
    i18n.t(`What happened?


What did you expect to happen?


Steps to reproduce{{colon}}
1.
2.
3.

Helpful details{{colon}}`, {
        colon: ':',
    }),
    `${i18n.t('Page{{colon}}', { colon: ':' })} ${getCurrentHashRoute()}`,
    `${i18n.t('Time{{colon}}', { colon: ':' })} ${new Date().toISOString()}`,
    `${i18n.t('Modeling App version{{colon}}', { colon: ':' })} ${modelingAppVersion}`,
    `${i18n.t('CHAP version{{colon}}', { colon: ':' })} ${chapVersion}`,
    `${i18n.t('DHIS2 version{{colon}}', { colon: ':' })} ${dhis2Version}`,
].join('\n');

type Props = {
    onClose: () => void;
};

export const ReportBugDialog = ({ onClose }: Props) => {
    const { appVersion, serverVersion, systemInfo } = useConfig();
    const { route } = useRoute();
    const { status } = useChapStatus({ route });
    const unknownVersion = i18n.t('Unknown');
    const chapVersion = status?.chap_core_version ?? unknownVersion;
    const dhis2Version =
        serverVersion?.full ?? systemInfo?.version ?? unknownVersion;
    const modelingAppVersion = appVersion?.full ?? unknownVersion;
    const reportTemplate = useMemo(
        () => createReportTemplate({
            chapVersion,
            dhis2Version,
            modelingAppVersion,
        }),
        [chapVersion, dhis2Version, modelingAppVersion],
    );
    const { show: showCopyErrorAlert } = useAlert(
        i18n.t('Failed to copy report details'),
        { success: false },
    );
    const {
        copy: copyReportTemplate,
        isCopied: isReportTemplateCopied,
    } = useCopyToClipboard({
        onError: () => showCopyErrorAlert(),
    });
    const {
        copy: copyEmailAddress,
        isCopied: isEmailAddressCopied,
    } = useCopyToClipboard({
        onError: () => showCopyErrorAlert(),
    });

    return (
        <Modal onClose={onClose} dataTest="report-bug-dialog">
            <ModalTitle>{i18n.t('Report a bug')}</ModalTitle>
            <ModalContent>
                <div className={styles.content}>
                    <p className={styles.intro}>
                        {i18n.t('Copy the template and email it to the CHAP team. It includes this page and time so we can find the problem faster.')}
                    </p>
                    <div className={styles.emailSection}>
                        <span className={styles.emailLabel}>
                            {i18n.t('Send to')}
                        </span>
                        <button
                            type="button"
                            className={styles.copyEmailButton}
                            title={
                                isEmailAddressCopied
                                    ? i18n.t('Copied email address')
                                    : i18n.t('Copy email address')
                            }
                            aria-label={
                                isEmailAddressCopied
                                    ? i18n.t('Copied email address')
                                    : i18n.t('Copy email address')
                            }
                            data-test="report-bug-copy-email-button"
                            onClick={() => copyEmailAddress(REPORT_EMAIL)}
                        >
                            <IconMail16 />
                            <code className={styles.emailAddress}>
                                {REPORT_EMAIL}
                            </code>
                            {isEmailAddressCopied ? <IconCheckmark16 /> : <IconCopy16 />}
                        </button>
                    </div>
                    <div className={styles.templateHeader}>
                        <h3 className={styles.templateTitle}>
                            {i18n.t('Bug report template')}
                        </h3>
                        <Button
                            small
                            secondary
                            icon={isReportTemplateCopied ? <IconCheckmark16 /> : <IconCopy16 />}
                            dataTest="report-bug-copy-template-button"
                            onClick={() => copyReportTemplate(reportTemplate)}
                        >
                            {isReportTemplateCopied
                                ? i18n.t('Copied')
                                : i18n.t('Copy template')}
                        </Button>
                    </div>
                    <pre className={styles.templateBox}>{reportTemplate}</pre>
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>
                        {i18n.t('Close')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
