import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:5173")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Navigate to the /dashboard page (http://localhost:5173/dashboard) and verify that the login screen or login prompt is shown instead of the protected dashboard content.
        await page.goto("http://localhost:5173/dashboard")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Navigate to the /students page and verify that the unauthenticated visitor is shown the login screen (presence of the login heading, email/password fields, or a 'تسجيل الدخول' button).
        await page.goto("http://localhost:5173/students")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # --> Assertions to verify final state
        
        # --> Verify the login screen is shown
        await page.locator('#email').scroll_into_view_if_needed()
        # Assert: The email input field is visible on the login screen.
        await expect(page.locator('#email')).to_be_visible(timeout=15000), "The email input field is visible on the login screen."
        await page.locator('#password').scroll_into_view_if_needed()
        # Assert: The password input field is visible on the login screen.
        await expect(page.locator('#password')).to_be_visible(timeout=15000), "The password input field is visible on the login screen."
        await page.get_by_role('button', name='تسجيل الدخول').scroll_into_view_if_needed()
        # Assert: The 'تسجيل الدخول' submit button is visible on the login screen.
        await expect(page.get_by_role('button', name='تسجيل الدخول')).to_be_visible(timeout=15000), "The '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644' submit button is visible on the login screen."
        
        # --> Verify access to the protected app is blocked
        await page.locator('#email').scroll_into_view_if_needed()
        # Assert: Email input field is visible on the login screen.
        await expect(page.locator('#email')).to_be_visible(timeout=15000), "Email input field is visible on the login screen."
        await page.locator('#password').scroll_into_view_if_needed()
        # Assert: Password input field is visible on the login screen.
        await expect(page.locator('#password')).to_be_visible(timeout=15000), "Password input field is visible on the login screen."
        await page.get_by_role('button', name='تسجيل الدخول').scroll_into_view_if_needed()
        # Assert: The login submit button labeled 'تسجيل الدخول' is visible, indicating access is redirected to login.
        await expect(page.get_by_role('button', name='تسجيل الدخول')).to_be_visible(timeout=15000), "The login submit button labeled '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644' is visible, indicating access is redirected to login."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    
