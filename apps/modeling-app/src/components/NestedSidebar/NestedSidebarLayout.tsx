import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft24 } from '@dhis2/ui-icons';
import i18n from '@dhis2/d2-i18n';
import styles from './NestedSidebarLayout.module.css';

interface NestedSidebarLayoutProps {
    children: ReactNode;
    sidebar: ReactNode;
    backLinkTo?: string;
    backLinkText?: string;
}

export const NestedSidebarLayout = ({
    children,
    sidebar,
    backLinkTo = '/',
    backLinkText,
}: NestedSidebarLayoutProps) => {
    const displayBackLinkText = backLinkText ?? i18n.t('Back to app');

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.backLink}>
                    <Link to={backLinkTo} className={styles.backLinkAnchor}>
                        <IconArrowLeft24 />
                        <span>{displayBackLinkText}</span>
                    </Link>
                </div>
                {sidebar}
            </aside>
            <main className={styles.content}>{children}</main>
        </div>
    );
};
