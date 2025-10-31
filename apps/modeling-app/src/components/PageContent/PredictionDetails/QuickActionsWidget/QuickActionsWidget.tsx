import React from 'react';
import { Button, ButtonStrip, IconImportItems24 } from '@dhis2/ui';
import { Link } from 'react-router-dom';
import i18n from '@dhis2/d2-i18n';
import { Widget } from '@dhis2-chap/ui';
import styles from './QuickActionsWidget.module.css';

type Props = {
    predictionId: number;
};

export const QuickActionsWidget = ({ predictionId }: Props) => {
    return (
        <Widget
            header={i18n.t('Quick actions')}
            noncollapsible
        >
            <div className={styles.content}>
                <ButtonStrip>
                    <Link to={`/predictions/${predictionId}/import`}>
                        <Button
                            dataTest="quick-action-import"
                            icon={<IconImportItems24 />}
                        >
                            {i18n.t('Import')}
                        </Button>
                    </Link>
                </ButtonStrip>
            </div>
        </Widget>
    );
};
