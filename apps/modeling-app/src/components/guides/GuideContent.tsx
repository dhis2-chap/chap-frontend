import React from 'react';
import type { Guide } from '@/content/guides';
import { MDXProvider } from './MDXProvider';
import styles from './GuideContent.module.css';

interface GuideContentProps {
    guide: Guide;
}

export const GuideContent = ({ guide }: GuideContentProps) => {
    const { Component } = guide;

    return (
        <article className={styles.article}>
            <MDXProvider>
                <Component />
            </MDXProvider>
        </article>
    );
};
