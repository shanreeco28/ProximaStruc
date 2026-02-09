from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    try:
        page.goto("http://localhost:5173")

        # Wait for loading to finish (Auth check)
        # It might show "Connecting to Cloud..." briefly
        # Then the Login View.

        # We look for the App Logo or Title
        page.wait_for_selector("text=SB-CasTrack", timeout=15000)

        # Take screenshot
        page.screenshot(path="verification/login_screen.png")
        print("Screenshot taken.")
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
