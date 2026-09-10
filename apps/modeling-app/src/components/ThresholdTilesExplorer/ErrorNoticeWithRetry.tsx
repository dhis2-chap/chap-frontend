import type { ReactNode } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, NoticeBox } from '@dhis2/ui';
import styles from './ErrorNoticeWithRetry.module.css';

type Props = {
    title: string;
    children: ReactNode;
    onRetry?: () => void;
};

export const ErrorNoticeWithRetry = ({ title, children, onRetry }: Props) => (
    <NoticeBox error title={title}>
        <div className={styles.content}>
            {children}
            {onRetry && (
                <Button small onClick={onRetry}>
                    {i18n.t('Retry')}
                </Button>
            )}
        </div>
    </NoticeBox>
);
