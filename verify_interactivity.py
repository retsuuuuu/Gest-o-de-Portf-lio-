import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:3000")
        except:
            print("Server not running")
            return

        await page.wait_for_selector("text=Gestão de Projetos")

        # Take a screenshot of the main page
        await page.screenshot(path="verification/dashboard_interactivity_start.png")

        # Click on a StatCard
        await page.click("text=PROJETOS EM ANDAMENTO")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification/dashboard_modal_open.png")

        await browser.close()

if __name__ == "__main__":
    import os
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify())
