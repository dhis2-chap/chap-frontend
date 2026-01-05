import type { ComponentType } from 'react';
import type { MDXProps } from 'mdx/types';

import GettingStarted, {
    frontmatter as gettingStartedFrontmatter,
} from './getting-started.mdx';

export interface GuideFrontmatter {
    title: string;
    description: string;
    order: number;
    category: string;
}

export interface Guide extends GuideFrontmatter {
    slug: string;
    Component: ComponentType<MDXProps>;
}

const createGuide = (
    slug: string,
    frontmatter: Record<string, unknown>,
    Component: ComponentType<MDXProps>,
): Guide => ({
    slug,
    ...(frontmatter as unknown as GuideFrontmatter),
    Component,
});

export const guides: Guide[] = [
    createGuide('getting-started', gettingStartedFrontmatter, GettingStarted),
];

export const getGuideBySlug = (slug: string): Guide | undefined => {
    return guides.find(guide => guide.slug === slug);
};

export const getGuidesByCategory = (category: string): Guide[] => {
    return guides
        .filter(guide => guide.category === category)
        .sort((a, b) => a.order - b.order);
};

export const getCategories = (): string[] => {
    return [...new Set(guides.map(guide => guide.category))];
};

export const getFirstGuide = (): Guide | undefined => {
    return guides.sort((a, b) => a.order - b.order)[0];
};
