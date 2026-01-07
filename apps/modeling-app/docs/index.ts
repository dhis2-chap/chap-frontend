import type { ComponentType } from 'react';
import type { MDXProps } from 'mdx/types';

// We import this from the user-guides folder even though it's a basic guide, but that's just to get the sync to work correctly
import GettingStarted, {
    frontmatter as gettingStartedFrontmatter,
} from './user-guides/getting-started/index.md';
import CreatingAnEvaluation, {
    frontmatter as creatingAnEvaluationFrontmatter,
} from './user-guides/creating-an-evaluation/index.md';
import CreatingAPrediction, {
    frontmatter as creatingAPredictionFrontmatter,
} from './user-guides/creating-a-prediction/index.md';
import WhatIsAModel, {
    frontmatter as whatIsAModelFrontmatter,
} from './basics/what-is-a-model/index.mdx';
import WhatIsAnEvaluation, {
    frontmatter as whatIsAnEvaluationFrontmatter,
} from './basics/what-is-an-evaluation/index.mdx';

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
    createGuide('what-is-a-model', whatIsAModelFrontmatter, WhatIsAModel),
    createGuide('what-is-an-evaluation', whatIsAnEvaluationFrontmatter, WhatIsAnEvaluation),
    createGuide('creating-an-evaluation', creatingAnEvaluationFrontmatter, CreatingAnEvaluation),
    createGuide('creating-a-prediction', creatingAPredictionFrontmatter, CreatingAPrediction),
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
