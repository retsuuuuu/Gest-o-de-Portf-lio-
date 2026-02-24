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

        # Capture Analytics Tab
        await page.click("text=Análises")
        await page.wait_for_selector("text=Análises de Desempenho")
        await asyncio.sleep(2)
        await page.screenshot(path="verification/analytics_tab.png")

        # Go back to Vision Geral
        await page.click("text=Visão Geral")

        # Open Create Modal
        await page.click("text=Novo Projeto")
        await page.wait_for_selector("text=Novo Projeto")

        # Type some date to verify mask
        date_input = page.locator('input[placeholder="DD/MM/AAAA"]').first
        await date_input.type("24022026")
        await asyncio.sleep(1)
        await page.screenshot(path="verification/create_modal.png")

        await browser.close()

if __name__ == "__main__":
    import os
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify())
