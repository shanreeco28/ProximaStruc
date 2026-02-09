from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    print("Navigating...")
    page.goto("http://localhost:5173")

    print("Waiting for Dashboard...")
    page.wait_for_selector("text=Project Overview", timeout=30000)

    print("Clicking Calendar...")
    page.click("button:has-text('Calendar')")

    print("Waiting for Calendar...")
    page.wait_for_selector("text=Actual HCS")

    print("Checking for BBS Target...")
    # Expect "Plan BBS: BBS-TEST"
    expect(page.locator("text=Plan BBS: BBS-TEST")).to_be_visible()

    print("Taking screenshot...")
    page.screenshot(path="verification/verification.png")

    browser.close()
    print("Done.")

with sync_playwright() as playwright:
    run(playwright)
