export const getCreatedTime = (created?: string | null) => {
    if (!created) {
        return 0;
    }

    const time = Date.parse(created);
    return Number.isNaN(time) ? 0 : time;
};

export const sortByCreatedDesc = <T extends { created?: string | null }>(items: T[]) => (
    [...items].sort((first, second) => getCreatedTime(second.created) - getCreatedTime(first.created))
);
