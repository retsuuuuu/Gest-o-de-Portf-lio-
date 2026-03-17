import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Set viewport to a common desktop size
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Enable auth bypass
        await page.add_init_script("window.localStorage.setItem('vite_bypass_auth', 'true');")

        print("Navigating to app...")
        await page.goto('http://localhost:5173', wait_until='networkidle')
        await page.wait_for_timeout(2000)

        # 1. Expand CLARO if needed (it seems expanded by default in the screenshot)
        claro_header = page.get_by_text("CLARO", exact=True)
        if await claro_header.is_visible():
            print("Found CLARO group.")
            # Ensure it's expanded (check if Tradehub is visible)
            tradehub = page.get_by_text("Tradehub", exact=True)
            if not await tradehub.is_visible():
                await claro_header.click()
                await page.wait_for_timeout(500)

        # 2. Expand Tradehub project
        tradehub = page.get_by_text("Tradehub", exact=True)
        if await tradehub.is_visible():
            print("Expanding Tradehub project...")
            await tradehub.click()
            await page.wait_for_timeout(1000)

        # 3. Click on the first item of Tradehub
        # The screenshot shows "TradeHub - Front - Criação do Fluxo de Venda..."
        item_text = "TradeHub - Front - Criação do Fluxo de Venda"
        item = page.get_by_text(item_text).first
        if await item.is_visible():
            print(f"Clicking on item: {item_text}...")
            # Click the text to open details
            await item.click()
            await page.wait_for_timeout(2000)

            # Take screenshot of details view
            await page.screenshot(path='home/jules/verification/details_view.png', full_page=True)
            print("Captured details_view.png")

            # Verify "Itens Atrelados" sidebar
            sidebar_header = page.get_by_text("Itens Atrelados", exact=True)
            if await sidebar_header.is_visible():
                print("Found 'Itens Atrelados' sidebar.")
                # The active item should have a specific class or border.
                # Our code uses: bg-indigo-50 border-indigo-600
                active_item = page.locator('.border-indigo-600').filter(has_text=item_text)
                if await active_item.is_visible():
                    print("Active item is correctly highlighted in sidebar.")
                else:
                    print("Warning: Active item highlight not found via .border-indigo-600")
            else:
                print("Error: 'Itens Atrelados' sidebar NOT found.")
        else:
            print("Error: Item NOT found in list.")
            await page.screenshot(path='home/jules/verification/debug_list.png')

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
