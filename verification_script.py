import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Go to app in test mode
    print("Navigating to app...")
    page.goto("http://localhost:5173/?test_mode=true")

    # Wait for dashboard
    page.wait_for_selector("text=Project Dashboard")
    print("Dashboard loaded.")

    # 2. Navigate to Site Diary
    print("Clicking Site Diary tab...")
    # Find the button with text "Site Diary" inside the nav
    page.get_by_role("button", name="Site Diary").click()
    # Wait for content
    page.wait_for_selector("text=Site Diary & Daily Reporting")

    # 3. Verify body class for diary
    body_class = page.eval_on_selector("body", "el => el.className")
    print(f"Body class after Site Diary load: '{body_class}'")
    if "print-portal-active-diary" not in body_class:
        print("ERROR: print-portal-active-diary class missing!")
        exit(1)
    else:
        print("SUCCESS: print-portal-active-diary class present.")

    # 4. Open Quick Report (from dashboard or nav? Nav has 'Quick Report')
    print("Opening Quick Report...")
    page.get_by_role("button", name="Quick Report").click()
    page.wait_for_selector("text=Executive Project Report")

    # 5. Verify body class for report
    body_class = page.eval_on_selector("body", "el => el.className")
    print(f"Body class after Report Modal open: '{body_class}'")
    if "print-portal-active-report" not in body_class:
        print("ERROR: print-portal-active-report class missing!")
        exit(1)
    else:
        print("SUCCESS: print-portal-active-report class present.")

    # 6. Take screenshot of Report Modal
    print("Taking screenshot...")
    page.screenshot(path="verification_report.png")

    # 7. Close Modal
    print("Closing modal via Escape key...")
    page.keyboard.press("Escape")
    time.sleep(1) # Wait for animation/unmount

    # 8. Verify body class after close
    body_class = page.eval_on_selector("body", "el => el.className")
    print(f"Body class after Modal close: '{body_class}'")

    if "print-portal-active-report" in body_class:
         print("ERROR: print-portal-active-report class still present!")
         # Sometimes animation delays unmount?
         # Check if modal is still visible?
         # If unmounted, class should be gone.
         exit(1)
    else:
         print("SUCCESS: print-portal-active-report class removed.")

    if "print-portal-active-diary" not in body_class:
         print("ERROR: print-portal-active-diary class missing (should still be there)!")
         exit(1)
    else:
         print("SUCCESS: print-portal-active-diary class still present.")

    browser.close()

with sync_playwright() as p:
    run(p)
