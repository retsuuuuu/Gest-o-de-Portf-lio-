from playwright.sync_api import sync_playwright

def verify_login(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(5000)
    page.screenshot(path="verification/clerk_login_final.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_login(page)
        finally:
            browser.close()
