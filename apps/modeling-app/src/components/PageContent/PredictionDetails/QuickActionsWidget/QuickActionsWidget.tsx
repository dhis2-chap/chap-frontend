import React from 'react';
import { Button, ButtonStrip, IconImportItems24, Tooltip } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Widget } from '@dhis2-chap/ui';
import styles from './QuickActionsWidget.module.css';

type Props = {
    predictionId: number;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const QuickActionsWidget = ({ predictionId }: Props) => {
    return (
        <Widget
            header={i18n.t('Quick actions')}
            noncollapsible
        >
            <div className={styles.content}>
                <ButtonStrip>
                    <Tooltip content={i18n.t('Importing predictions to DHIS2 will be added shortly')}>
                        <Button
                            disabled
                            dataTest="quick-action-import"
                            icon={<IconImportItems24 />}
                        >
                            {i18n.t('Import')}
                        </Button>
                    </Tooltip>
                </ButtonStrip>
            </div>
        </Widget>
    );
};
