import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()
        await page.add_init_script("window.localStorage.setItem('vite_bypass_auth', 'true');")

        await page.goto('http://localhost:5173', wait_until='networkidle')
        await page.wait_for_timeout(2000)

        # Expand CLARO
        await page.get_by_text("CLARO", exact=True).click()
        await page.wait_for_timeout(500)

        # Expand Tradehub
        await page.get_by_text("Tradehub", exact=True).click()
        await page.wait_for_timeout(500)

        # Click Edit (the pencil icon in the list)
        edit_button = page.locator('button:has(svg.lucide-pencil)').first
        await edit_button.click()
        await page.wait_for_timeout(1000)

        # Take screenshot of edit modal
        await page.screenshot(path='home/jules/verification/edit_modal.png')
        print("Captured edit_modal.png")

        # Check for Project Code field
        code_field = page.get_by_label("Código do Projeto")
        if await code_field.is_visible():
            print("Project Code field is visible in edit modal.")
        else:
            print("Error: Project Code field NOT found in edit modal.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
