
from playwright.sync_api import sync_playwright

def test_calendar_view():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to app with test mode to bypass auth
        page.goto("http://localhost:5173/?test_mode=true")

        # Wait for dashboard to load
        page.wait_for_selector("text=Project Dashboard")

        # Click on Calendar tab
        # The button has text "Calendar"
        page.get_by_role("button", name="Calendar").click()

        # Wait for Calendar view to load
        # We expect month name and grid
        page.wait_for_selector(".grid-cols-7")

        # Take screenshot
        page.screenshot(path="/app/verification/calendar_verification.png")

        print("Screenshot taken successfully")
        browser.close()

if __name__ == "__main__":
    test_calendar_view()
