import type { ComponentType } from 'react';
import type { MDXProps } from 'mdx/types';

import GettingStarted from './getting-started.mdx';

export interface Guide {
    slug: string;
    title: string;
    description: string;
    order: number;
    category: string;
    Component: ComponentType<MDXProps>;
}

export const guides: Guide[] = [
    {
        slug: 'getting-started',
        title: 'Getting Started',
        description: 'Introduction to CHAP and how to get started with the modeling app',
        order: 1,
        category: 'Basics',
        Component: GettingStarted,
    },
];

export const getGuideBySlug = (slug: string): Guide | undefined => {
    return guides.find((guide) => guide.slug === slug);
};

export const getGuidesByCategory = (category: string): Guide[] => {
    return guides
        .filter((guide) => guide.category === category)
        .sort((a, b) => a.order - b.order);
};

export const getCategories = (): string[] => {
    return [...new Set(guides.map((guide) => guide.category))];
};

export const getFirstGuide = (): Guide | undefined => {
    return guides.sort((a, b) => a.order - b.order)[0];
};
