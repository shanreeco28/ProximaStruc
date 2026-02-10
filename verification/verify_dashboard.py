from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    try:
        page.goto("http://localhost:5173")

        # Wait for "Project Dashboard" to appear
        page.wait_for_selector("text=Project Dashboard", timeout=30000)

        # 1. Screenshot Dashboard
        page.screenshot(path="verification/dashboard_ui.png")
        print("Captured dashboard_ui.png")

        # Verify Critical Tasks text truncation
        # Look for "Overdue Schedules" and "Next Casting"
        if page.is_visible("text=Overdue Schedules"):
             print("Found 'Overdue Schedules'")

        # 2. Switch to Calendar Tab
        page.click("text=Calendar")

        # Wait for calendar to render
        page.wait_for_selector("text=Today", timeout=10000)
        time.sleep(2) # Allow transitions

        # 3. Screenshot Calendar
        page.screenshot(path="verification/calendar_ui.png")
        print("Captured calendar_ui.png")

        # 4. Hover over DONE-SAME-DAY
        # Locator for the event bubble
        # Text inside bubble is "Done: DONE-SAME-DAY"
        same_day_event = page.locator("text=Done: DONE-SAME-DAY")
        if same_day_event.count() > 0:
            same_day_event.first.hover()
            time.sleep(1) # Wait for hover effect
            page.screenshot(path="verification/calendar_hover_same.png")
            print("Captured calendar_hover_same.png")
        else:
            print("Could not find DONE-SAME-DAY event")

        # 5. Hover over DONE-DIFF-DAY
        # Text: "Done: DONE-DIFF-DAY"
        diff_day_event = page.locator("text=Done: DONE-DIFF-DAY")
        if diff_day_event.count() > 0:
             diff_day_event.first.hover()
             time.sleep(1)
             page.screenshot(path="verification/calendar_hover_diff.png")
             print("Captured calendar_hover_diff.png")
        else:
             print("Could not find DONE-DIFF-DAY event")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error_dashboard.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
