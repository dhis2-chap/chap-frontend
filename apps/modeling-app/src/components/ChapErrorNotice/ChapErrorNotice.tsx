import type { ReactNode } from 'react';
import { NoticeBox } from '@dhis2/ui';
import { getChapErrorMessage, getChapErrorTitle } from '../../utils/chapErrors';

type Props = {
    error?: { status?: number; message?: string } | null;
    /** Shown unless the request was refused, in which case the token problem takes over. */
    title: string;
    className?: string;
    /** Extra guidance or actions shown below the error message. */
    children?: ReactNode;
};

export const ChapErrorNotice = ({ error, title, className, children }: Props) => (
    <NoticeBox error title={getChapErrorTitle(error, title)} className={className}>
        {children ? <p>{getChapErrorMessage(error)}</p> : getChapErrorMessage(error)}
        {children}
    </NoticeBox>
);
