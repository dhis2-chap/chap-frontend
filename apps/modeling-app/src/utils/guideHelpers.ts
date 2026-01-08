export interface GuideBase {
    slug: string;
    title: string;
    description: string;
    order: number;
    category?: string;
}

export const getGuideBySlug = <T extends GuideBase>(guides: T[], slug: string): T | undefined => {
    return guides.find(guide => guide.slug === slug);
};

export const getGuidesByCategory = <T extends GuideBase>(guides: T[], category: string): T[] => {
    return guides
        .filter(guide => guide.category === category)
        .sort((a, b) => a.order - b.order);
};

export const getRootGuides = <T extends GuideBase>(guides: T[]): T[] => {
    return guides
        .filter(guide => !guide.category)
        .sort((a, b) => a.order - b.order);
};

export const getCategories = <T extends GuideBase>(guides: T[]): string[] => {
    return [...new Set(guides.map(guide => guide.category).filter((c): c is string => !!c))];
};

export const getFirstGuide = <T extends GuideBase>(guides: T[]): T | undefined => {
    return [...guides].sort((a, b) => a.order - b.order)[0];
};
