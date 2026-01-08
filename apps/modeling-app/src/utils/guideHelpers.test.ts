import { describe, it, expect } from 'vitest';
import {
    getGuideBySlug,
    getGuidesByCategory,
    getRootGuides,
    getCategories,
    getFirstGuide,
    type GuideBase,
} from './guideHelpers';

const mockGuides: GuideBase[] = [
    { slug: 'getting-started', title: 'Getting Started', description: 'Intro', order: 0 },
    { slug: 'what-is-a-model', title: 'What is a Model', description: 'Models', order: 1, category: 'Core concepts' },
    { slug: 'what-is-an-evaluation', title: 'What is an Evaluation', description: 'Evals', order: 2, category: 'Core concepts' },
    { slug: 'creating-a-prediction', title: 'Creating a Prediction', description: 'Predictions', order: 1, category: 'User Guides' },
];

describe('guideHelpers', () => {
    it('getGuideBySlug finds guide by slug', () => {
        expect(getGuideBySlug(mockGuides, 'getting-started')?.title).toBe('Getting Started');
        expect(getGuideBySlug(mockGuides, 'non-existent')).toBeUndefined();
    });

    it('getGuidesByCategory returns sorted guides for category', () => {
        const result = getGuidesByCategory(mockGuides, 'Core concepts');
        expect(result.map(g => g.slug)).toEqual(['what-is-a-model', 'what-is-an-evaluation']);
    });

    it('getRootGuides returns guides without category', () => {
        const result = getRootGuides(mockGuides);
        expect(result.map(g => g.slug)).toEqual(['getting-started']);
    });

    it('getCategories returns unique categories', () => {
        expect(getCategories(mockGuides)).toEqual(['Core concepts', 'User Guides']);
    });

    it('getFirstGuide returns guide with lowest order', () => {
        expect(getFirstGuide(mockGuides)?.slug).toBe('getting-started');
    });

    it('getFirstGuide does not mutate original array', () => {
        const guides = [...mockGuides];
        const firstSlug = guides[0].slug;
        getFirstGuide(guides);
        expect(guides[0].slug).toBe(firstSlug);
    });
});
