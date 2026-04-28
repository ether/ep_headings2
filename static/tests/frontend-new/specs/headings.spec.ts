import {expect, test} from '@playwright/test';
import {clearPadContent, getPadBody, goToNewPad, writeToPad}
    from 'ep_etherpad-lite/tests/frontend-new/helper/padHelper';

test.beforeEach(async ({page}) => {
  await goToNewPad(page);
});

test.describe('ep_headings2 - Set Heading and ensure its removed properly', () => {
  test('Heading select has aria-label for accessibility', async ({page}) => {
    const select = page.locator('#heading-selection');
    await expect(select).toHaveAttribute('aria-label', /.+/);
  });

  test('Focus returns to editor after selecting a heading', async ({page}) => {
    const padBody = await getPadBody(page);
    await padBody.click();
    await clearPadContent(page);
    await writeToPad(page, 'Test focus');

    // Pick H1 in the heading-selection <select>; the niceSelect wrapper
    // intercepts native change events so we set the value on the
    // underlying element and dispatch change manually, matching what
    // the legacy spec did with chrome$('#heading-selection').change().
    await page.evaluate(() => {
      const sel = document.querySelector<HTMLSelectElement>('#heading-selection')!;
      sel.value = '0';
      sel.dispatchEvent(new Event('change', {bubbles: true}));
    });

    // The line gains an <h1> wrapper.
    await expect(padBody.locator('div').first().locator('h1')).toHaveCount(1);

    // Focus should return to the inner ace iframe (not the toolbar
    // <select> the user just clicked). Verify by checking activeElement
    // in the outer document is the ace_inner iframe.
    const focusedFrameName = await page.evaluate(() => {
      const ae = document.activeElement as HTMLElement | null;
      return (ae?.tagName === 'IFRAME' && (ae as HTMLIFrameElement).name) || null;
    });
    expect(focusedFrameName).toBe('ace_outer');
  });

  test('Option select is changed when heading is changed', async ({page}) => {
    const padBody = await getPadBody(page);
    await padBody.click();
    await clearPadContent(page);
    await writeToPad(page, 'First Line!');

    // Apply H1 to the first line.
    await page.evaluate(() => {
      const sel = document.querySelector<HTMLSelectElement>('#heading-selection')!;
      sel.value = '0';
      sel.dispatchEvent(new Event('change', {bubbles: true}));
    });
    await expect(padBody.locator('div').first().locator('h1')).toHaveCount(1);

    // Move to a fresh second line — the selector should reset to
    // "no heading" (-1) because the cursor is no longer on an H1.
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Second Line');

    // Wait for the selector to update to "-1" (Etherpad polls the
    // current line's heading attribute on caret moves).
    await expect.poll(async () =>
      page.evaluate(() =>
        (document.querySelector<HTMLSelectElement>('#heading-selection')!).value),
    {timeout: 10_000}).toBe('-1');

    // Second line is plain text, not wrapped in <h1>.
    const second = padBody.locator('div').nth(1);
    await expect(second.locator('h1')).toHaveCount(0);
    await expect(second).toHaveText('Second Line');
  });
});
