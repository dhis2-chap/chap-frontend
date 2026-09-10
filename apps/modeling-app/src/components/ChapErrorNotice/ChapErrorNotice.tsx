import { NoticeBox } from '@dhis2/ui';
import { getChapErrorMessage, getChapErrorTitle } from '../../utils/chapErrors';

type Props = {
    error?: { status?: number; message?: string } | null;
    /** Shown unless the request was refused, in which case the token problem takes over. */
    title: string;
    className?: string;
};

export const ChapErrorNotice = ({ error, title, className }: Props) => (
    <NoticeBox error title={getChapErrorTitle(error, title)} className={className}>
        {getChapErrorMessage(error)}
    </NoticeBox>
);
