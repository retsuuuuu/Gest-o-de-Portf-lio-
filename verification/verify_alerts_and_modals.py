from playwright.sync_api import sync_playwright

def verify_ui(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(5000) # Wait for load

    # Take screenshot of dashboard to see delayed project highlight
    page.screenshot(path="verification/dashboard_alerts.png")

    # Click Notification bell
    page.click("button:has(svg.lucide-bell)")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/notifications_open.png")

    # Close it (the X button inside the modal)
    # The modal has a button with X icon
    page.click("button:has(svg.lucide-x)")
    page.wait_for_timeout(1000)

    # Click Settings gear
    page.click("button:has(svg.lucide-settings)")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/settings_open.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_ui(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_modal.png")
        finally:
            browser.close()
