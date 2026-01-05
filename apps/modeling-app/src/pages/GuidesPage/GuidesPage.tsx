import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getGuideBySlug, getFirstGuide } from '@/content/guides';
import { GuidesLayout } from '@/components/guides/GuidesLayout';
import { GuideContent } from '@/components/guides/GuideContent';
import styles from './GuidesPage.module.css';

export const GuidesPage = () => {
    const { guideSlug } = useParams<{ guideSlug: string }>();

    if (!guideSlug) {
        const firstGuide = getFirstGuide();
        if (firstGuide) {
            return <Navigate to={`/guides/${firstGuide.slug}`} replace />;
        }
        return (
            <GuidesLayout>
                <div className={styles.noGuides}>No guides available</div>
            </GuidesLayout>
        );
    }

    const guide = getGuideBySlug(guideSlug);

    if (!guide) {
        return (
            <GuidesLayout>
                <div className={styles.notFound}>
                    <h1>Guide not found</h1>
                    <p>
                        The guide &quot;
                        {guideSlug}
                        &quot; could not be found.
                    </p>
                </div>
            </GuidesLayout>
        );
    }

    return (
        <GuidesLayout>
            <GuideContent guide={guide} />
        </GuidesLayout>
    );
};
