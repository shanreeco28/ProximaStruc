from playwright.sync_api import sync_playwright

def verify_ai_enhancer():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create a new page
        page = browser.new_page()

        # Navigate to the site diary view (the app uses test_mode to bypass auth)
        page.goto("http://localhost:5173/site-diary?test_mode=true")

        # Wait for the view to load and stabilize
        page.wait_for_timeout(2000)

        # Check for the button
        enhance_btn = page.locator("button", has_text="Auto-Enhance")

        # Take screenshot of the component containing the button
        page.screenshot(path="/app/verification/ai-button.png")

        print("Verification script ran. Check screenshot.")

        browser.close()

if __name__ == "__main__":
    verify_ai_enhancer()
