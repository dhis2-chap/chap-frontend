import React from 'react';
import styles from './PageHeader.module.css';
import { Button, IconAdd16 } from '@dhis2/ui';

interface PageHeaderProps {
    pageTitle: string;
    pageDescription?: string;
    setDrawerOpen?: (isOpen: boolean) => void;
    setDrawerOpenText?: string;
}

export const PageHeader = ({
    pageTitle,
    pageDescription,
    setDrawerOpen,
    setDrawerOpenText,
}: PageHeaderProps) => {
    return (
        <div className={styles.pageHeader}>
            <div>
                <h2>{pageTitle}</h2>
                <p className={styles.pageDescription}>{pageDescription}</p>
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
