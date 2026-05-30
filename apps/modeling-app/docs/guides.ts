import type { ComponentType } from 'react';
import type { MDXProps } from 'mdx/types';
import {
    getGuideBySlug as getGuideBySlugHelper,
    getGuidesByCategory as getGuidesByCategoryHelper,
    getRootGuides as getRootGuidesHelper,
    getCategories as getCategoriesHelper,
    getFirstGuide as getFirstGuideHelper,
} from '@/utils/guideHelpers';
import GettingStarted, {
    frontmatter as gettingStartedFrontmatter,
} from './user-guides/getting-started/index.md';
import ConfiguringAModel, {
    frontmatter as configuringAModelFrontmatter,
} from './user-guides/configuring-a-model/index.md';
import CreatingAnEvaluation, {
    frontmatter as creatingAnEvaluationFrontmatter,
} from './user-guides/creating-an-evaluation/index.md';
import CreatingAPrediction, {
    frontmatter as creatingAPredictionFrontmatter,
} from './user-guides/creating-a-prediction/index.md';
import ViewingEvaluationResults, {
    frontmatter as viewingEvaluationResultsFrontmatter,
} from './user-guides/viewing-evaluation-results/index.md';
import ComparingEvaluations, {
    frontmatter as comparingEvaluationsFrontmatter,
} from './user-guides/comparing-evaluations/index.md';
import Settings, {
    frontmatter as settingsFrontmatter,
} from './user-guides/settings/index.md';
import WhatIsAModel, {
    frontmatter as whatIsAModelFrontmatter,
} from './basics/what-is-a-model/index.mdx';
import WhatIsAnEvaluation, {
    frontmatter as whatIsAnEvaluationFrontmatter,
} from './basics/what-is-an-evaluation/index.mdx';
import WhatAreCovariates, {
    frontmatter as whatAreCovariatesFrontmatter,
} from './basics/what-are-covariates/index.mdx';
import WhatIsAPredictionInterval, {
    frontmatter as whatIsAPredictionIntervalFrontmatter,
} from './basics/what-is-a-prediction-interval/index.mdx';

export interface GuideFrontmatter {
    title: string;
    description: string;
    order: number;
    category?: string;
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
    createGuide('what-are-covariates', whatAreCovariatesFrontmatter, WhatAreCovariates),
    createGuide('what-is-a-prediction-interval', whatIsAPredictionIntervalFrontmatter, WhatIsAPredictionInterval),
    createGuide('configuring-a-model', configuringAModelFrontmatter, ConfiguringAModel),
    createGuide('creating-an-evaluation', creatingAnEvaluationFrontmatter, CreatingAnEvaluation),
    createGuide('creating-a-prediction', creatingAPredictionFrontmatter, CreatingAPrediction),
    createGuide('viewing-evaluation-results', viewingEvaluationResultsFrontmatter, ViewingEvaluationResults),
    createGuide('comparing-evaluations', comparingEvaluationsFrontmatter, ComparingEvaluations),
    createGuide('settings', settingsFrontmatter, Settings),
];

export const getGuideBySlug = (slug: string): Guide | undefined =>
    getGuideBySlugHelper(guides, slug);

export const getGuidesByCategory = (category: string): Guide[] =>
    getGuidesByCategoryHelper(guides, category);

export const getRootGuides = (): Guide[] =>
    getRootGuidesHelper(guides);

export const getCategories = (): string[] =>
    getCategoriesHelper(guides);

export const getFirstGuide = (): Guide | undefined =>
    getFirstGuideHelper(guides);
