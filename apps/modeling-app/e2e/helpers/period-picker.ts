import { expect, type Page } from '@playwright/test';

export const openPeriodPickerAtYear = async (
    page: Page,
    triggerDataTest: string,
    periodId: string,
) => {
    await page.locator(`[data-test="${triggerDataTest}"]`).click();

    const targetYear = Number(periodId.slice(0, 4));
    const visibleYear = page.locator(`[data-test="${triggerDataTest}-visible-year"]`);

    await visibleYear.selectOption(String(targetYear));
    await expect(visibleYear).toHaveValue(String(targetYear));
};

export const selectPeriod = async (
    page: Page,
    triggerDataTest: string,
    periodId: string,
) => {
    const canonicalPeriodId = periodId.replace(/W0+([1-9]\d*)$/, 'W$1');

    await openPeriodPickerAtYear(page, triggerDataTest, canonicalPeriodId);

    await page.locator(`[data-test="${triggerDataTest}-option-${canonicalPeriodId}"]`).click();
};
