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

        # 1. Check Project List grouping and click a Project
        await page.get_by_text("CLARO", exact=True).click()
        await page.wait_for_timeout(500)

        # Click the project card to go to Project Details
        await page.get_by_text("Tradehub", exact=True).click()
        await page.wait_for_timeout(1000)
        await page.screenshot(path='home/jules/verification/project_details.png')
        print("Captured project_details.png")

        # 2. Click an Item in Project Details
        # The text might be long, let's find one
        await page.get_by_text("Criação do Fluxo").first.click()
        await page.wait_for_timeout(1000)
        await page.screenshot(path='home/jules/verification/item_details.png')
        print("Captured item_details.png")

        # 3. Check for Responsible assignment button
        assign_btn = page.locator('button:has(svg.lucide-plus)').first
        if await assign_btn.is_visible():
            print("Responsible assignment button is visible.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
