import {expect, test} from '@playwright/test';
import {clearPadContent, getPadBody, goToNewPad, writeToPad}
    from 'ep_etherpad-lite/tests/frontend-new/helper/padHelper';

test.beforeEach(async ({page}) => {
  await goToNewPad(page);
});

// https://github.com/ether/ep_headings2/issues/52
test.describe('ep_headings2 file menu', () => {
  test('Applies a heading from the Format menu', async ({page}) => {
    test.skip(await page.locator('.dropdown-menu').count() === 0,
        'ep_file_menu_toolbar is not installed');

    const padBody = await getPadBody(page);
    await padBody.click();
    await clearPadContent(page);
    await writeToPad(page, 'First Line!');

    // The select lives in the collapsed "Format" submenu, so set the value
    // and fire change on the element itself — the same thing the existing
    // specs do for the editbar dropdown, which niceSelect also wraps.
    await page.evaluate(() => {
      const sel = document.querySelector<HTMLSelectElement>(
          '.dropdown-menu select.heading-selection')!;
      sel.value = '0';
      sel.dispatchEvent(new Event('change', {bubbles: true}));
    });

    await expect(padBody.locator('div').first().locator('h1')).toHaveCount(1);
  });

  test('Both heading dropdowns follow the caret', async ({page}) => {
    test.skip(await page.locator('.dropdown-menu').count() === 0,
        'ep_file_menu_toolbar is not installed');

    const padBody = await getPadBody(page);
    await padBody.click();
    await clearPadContent(page);
    await writeToPad(page, 'First Line!');

    await page.evaluate(() => {
      const sel = document.querySelector<HTMLSelectElement>('#heading-selection')!;
      sel.value = '0';
      sel.dispatchEvent(new Event('change', {bubbles: true}));
    });
    await expect(padBody.locator('div').first().locator('h1')).toHaveCount(1);

    // The copy in the file menu tracks the caret just like the editbar one.
    await expect.poll(async () => page.evaluate(() => (
      document.querySelector<HTMLSelectElement>(
          '.dropdown-menu select.heading-selection')!).value),
    {timeout: 10_000}).toBe('0');
  });
});
