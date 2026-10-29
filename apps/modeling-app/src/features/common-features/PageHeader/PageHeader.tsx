import styles from './PageHeader.module.css';
import i18n from '@dhis2/d2-i18n';
import { Link } from 'react-router-dom';
import { Button, IconAdd16 } from '@dhis2/ui';

interface PageHeaderProps {
    pageTitle: string;
    pageDescription?: string;
    guideSlug?: string;
    setDrawerOpen?: (isOpen: boolean) => void;
    setDrawerOpenText?: string;
}

export const PageHeader = ({
    pageTitle,
    pageDescription,
    guideSlug,
    setDrawerOpen,
    setDrawerOpenText,
}: PageHeaderProps) => {
    return (
        <div className={styles.pageHeader}>
            <div>
                <h2>{pageTitle}</h2>
                <p className={styles.pageDescription}>
                    {pageDescription}
                    {guideSlug && (
                        <>
                            {' '}
                            <Link className={styles.guideLink} to={`/guides/${guideSlug}`}>{i18n.t('Read the guide')}</Link>
                        </>
                    )}
                </p>
            </div>
            {setDrawerOpen && setDrawerOpenText && (
                <Button
                    onClick={() => setDrawerOpen(true)}
                    icon={<IconAdd16 />}
                    primary
                >
                    {setDrawerOpenText}
                </Button>
            )}
        </div>
    );
};
