import React from 'react';
import { NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Card, ModelTemplateRead } from '@dhis2-chap/ui';

export const NewModelForm = ({ modelTemplates }: { modelTemplates: ModelTemplateRead[] }) => {
    return (
        <Card>
            <NoticeBox title={i18n.t('Model templates loaded')}>
                {i18n.t('Loaded {{count}} model templates. The new model form will be implemented soon.', {
                    count: modelTemplates?.length ?? 0,
                })}
            </NoticeBox>
        </Card>
    );
};
