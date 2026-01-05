import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft24 } from '@dhis2/ui-icons';
import { GuidesSidebar } from './GuidesSidebar';
import styles from './GuidesLayout.module.css';

interface GuidesLayoutProps {
    children: ReactNode;
}

export const GuidesLayout = ({ children }: GuidesLayoutProps) => {
    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.backLink}>
                    <Link to="/" className={styles.backLinkAnchor}>
                        <IconArrowLeft24 />
                        <span>Back to app</span>
                    </Link>
                </div>
                <GuidesSidebar />
            </aside>
            <main className={styles.content}>{children}</main>
        </div>
    );
};
