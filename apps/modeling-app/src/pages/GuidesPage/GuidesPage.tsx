import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import i18n from '@dhis2/d2-i18n';
import { getGuideBySlug, getFirstGuide } from '@docs/index';
import { GuidesLayout } from '@/components/Guides/GuidesLayout';
import { GuideContent } from '@/components/Guides/GuideContent';
import { ID_MAIN_LAYOUT } from '@/components/layout/Layout';
import styles from './GuidesPage.module.css';

export const GuidesPage = () => {
    const { guideSlug } = useParams<{ guideSlug: string }>();

    useEffect(() => {
        // Hacky way to scroll to the top of the page when the guide slug changes
        const mainLayout = document.getElementById(ID_MAIN_LAYOUT);
        mainLayout?.scrollTo(0, 0);
    }, [guideSlug]);

    if (!guideSlug) {
        const firstGuide = getFirstGuide();
        if (firstGuide) {
            return <Navigate to={`/guides/${firstGuide.slug}`} replace />;
        }
        return (
            <GuidesLayout>
                <div className={styles.noGuides}>{i18n.t('No guides available')}</div>
            </GuidesLayout>
        );
    }

    const guide = getGuideBySlug(guideSlug);

    if (!guide) {
        return (
            <GuidesLayout>
                <div className={styles.notFound}>
                    <h1>{i18n.t('Guide not found')}</h1>
                    <p>
                        {i18n.t('The guide "{{guideSlug}}" could not be found.', { guideSlug })}
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
