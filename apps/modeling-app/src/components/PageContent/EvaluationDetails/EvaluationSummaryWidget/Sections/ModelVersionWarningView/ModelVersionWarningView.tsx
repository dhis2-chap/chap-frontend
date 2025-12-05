import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { Widget } from '@dhis2-chap/ui';
import { IconWarning16 } from '@dhis2/ui';
import styles from '../../EvaluationSummaryWidget.module.css';

type Props = {
    modelTemplateVersion?: string | null;
    configuredModelTemplateVersion?: string | null;
};

export const ModelVersionWarningView = ({
    modelTemplateVersion,
    configuredModelTemplateVersion,
}: Props) => {
    if (!modelTemplateVersion || !configuredModelTemplateVersion || modelTemplateVersion === configuredModelTemplateVersion) {
        return null;
    }

    return (
        <Widget
            noncollapsible
            header={(
                <span className={styles.errorCardHeader}>
                    <IconWarning16 />
                    {i18n.t('Model updated')}
                </span>
            )}
            color="var(--colors-yellow100)"
        >
            <span className={styles.errorCardContent}>
                {i18n.t('The model used to run this evaluation has been updated. You can still view the results of the run, but the metadata may not be accurate.')}
            </span>
        </Widget>
    );
};
