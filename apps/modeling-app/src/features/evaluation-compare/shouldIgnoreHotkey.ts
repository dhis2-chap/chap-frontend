export const shouldIgnoreHotkey = (event: KeyboardEvent): boolean => {
    if (
        event.defaultPrevented
        || event.repeat
        || event.ctrlKey
        || event.metaKey
        || event.altKey
        || event.shiftKey
    ) {
        return true;
    }

    const target = event.target as HTMLElement | null;
    const isTypingTarget =
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || !!target?.isContentEditable;
    if (isTypingTarget) return true;

    const isSliderTarget = target instanceof Element &&
        target.closest('[role="slider"]') !== null;
    if (isSliderTarget) return true;

    return false;
};
