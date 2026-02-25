import { test, expect } from '@playwright/test';

test('verify edit modal layout and fields', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  // Wait for projects to load (they are fetched from API)
  await page.waitForSelector('table tbody tr');

  // Click the pencil icon of the first project
  await page.click('button:has(svg.lucide-pencil)');

  // Wait for the modal to appear
  await page.waitForSelector('h2:has-text("Editar Projeto")');

  // Take a screenshot
  await page.screenshot({ path: 'verification/edit_modal_check.png' });

  // Check for "Código do Projeto" label
  const codeLabel = await page.locator('label:has-text("Código do Projeto")');
  await expect(codeLabel).toBeVisible();

  // Check for the grid layout (md:grid-cols-2)
  const grid = await page.locator('form > div.grid');
  const className = await grid.getAttribute('class');
  expect(className).toContain('md:grid-cols-2');
});
