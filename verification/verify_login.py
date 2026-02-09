from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to app on port 4173...")
            page.goto("http://localhost:4173")

            print("Waiting for 'Sign In' or 'Project Overview'...")
            # Wait for either login screen or dashboard
            try:
                page.wait_for_selector("text=Sign In", timeout=5000)
                print("Login screen detected.")
            except:
                print("Login screen not detected, checking for Dashboard...")
                page.wait_for_selector("text=Project Overview", timeout=5000)
                print("Dashboard detected.")

            print("Taking screenshot...")
            page.screenshot(path="verification/verification.png")
            print("Screenshot saved to verification/verification.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
