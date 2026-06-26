import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        pw = await async_api.async_playwright().start()

        browser = await pw.chromium.launch(
            headless=False,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
        )

        context = await browser.new_context()
        context.set_default_timeout(30000)

        page = await context.new_page()

        await page.goto("http://localhost:5173/auth")
        
        await page.locator('[id="email"]').wait_for(state="visible", timeout=10000)
        await page.locator('[id="email"]').fill("organizer@qsm.com")

        await page.locator('[id="password"]').fill("password")

        await page.get_by_role('button', name='تسجيل الدخول').click()

        await page.wait_for_url(re.compile("/dashboard"), timeout=30000)

        await expect(page.locator('body')).to_contain_text("لوحة التحكم", timeout=10000)

        print("Test passed successfully!")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())