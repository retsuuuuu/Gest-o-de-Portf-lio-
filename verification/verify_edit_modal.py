from playwright.sync_api import sync_playwright, expect

def verify_edit_modal(page):
    page.goto("http://localhost:3000")

    # Wait for the table to load
    page.wait_for_selector("table tbody tr")

    # Click the pencil icon of the first project
    # Using the Pencil icon class or finding it by role/title if possible
    pencil_button = page.locator("button:has(svg.lucide-pencil)").first
    pencil_button.click()

    # Wait for the edit modal
    page.wait_for_selector("text=Editar Projeto")

    # Verify "Código do Projeto" is present
    expect(page.get_by_text("Código do Projeto")).to_be_visible()

    # Take screenshot of the modal
    # We want to see the grid layout
    page.screenshot(path="verification/edit_modal_layout.png")

    print("Verification successful: Edit modal is visible with 'Código do Projeto' field.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_edit_modal(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error_screenshot.png")
        finally:
            browser.close()
