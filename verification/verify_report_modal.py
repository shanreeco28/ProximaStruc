from playwright.sync_api import sync_playwright

def verify_report_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to Dashboard in Test Mode
        print("Navigating to Dashboard...")
        page.goto("http://localhost:5173/?test_mode=true")

        # Wait for either project selection or dashboard
        print("Waiting for initial load...")
        try:
            page.wait_for_selector("text=Select Project", timeout=5000)
            print("Project Selection screen found. Selecting project...")
            # Click the first project card (looking for 'Open Workspace' or project name)
            page.click("text=Open Workspace")
        except:
            print("Project Selection not found, assuming Dashboard or loading...")

        # Wait for the dashboard to load
        print("Waiting for Dashboard...")
        try:
            page.wait_for_selector("text=Project Dashboard", timeout=10000)
        except Exception as e:
            print("Dashboard did not load:", e)
            page.screenshot(path="/home/jules/verification/failed_load.png")
            browser.close()
            return

        # Click 'Generate Report'
        print("Opening Report Modal...")
        page.click("text=Generate Report")

        # Wait for the modal to be visible
        try:
            page.wait_for_selector("text=Executive Project Report", timeout=5000)
        except:
             print("Report modal did not open")
             page.screenshot(path="/home/jules/verification/failed_modal.png")
             browser.close()
             return

        # Emulate print media to test print styles
        print("Emulating print media...")
        page.emulate_media(media="print")

        # Wait a bit for styles to apply (if any transition/repaint needed)
        page.wait_for_timeout(1000)

        # Take a screenshot of the entire page
        # In print emulation, this should show only the report if my CSS is correct
        screenshot_path = "/home/jules/verification/report_print_preview.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_report_modal()
