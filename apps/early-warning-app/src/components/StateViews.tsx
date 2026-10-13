import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';

export const Loading = () => <CircularLoader small />;

export const ErrorNotice = ({ error }: { error: unknown }) => (
    <NoticeBox error title={i18n.t('Unable to load data')}>
        {error instanceof Error ? error.message : i18n.t('Please try again.')}
    </NoticeBox>
);
