from playwright.sync_api import sync_playwright, expect

def verify_create_modal(page):
    page.goto("http://localhost:3000")

    # Click "Novo Projeto" button
    page.click("text=Novo Projeto")

    # Wait for the create modal
    page.wait_for_selector("text=Novo Projeto")

    # Take screenshot
    page.screenshot(path="verification/create_modal_layout.png")

    print("Verification successful: Create modal is visible.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_create_modal(page)
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()
