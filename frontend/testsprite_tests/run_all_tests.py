import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test(page: "async_api.Page", email: str, password: str):
    await page.goto("http://localhost:5173/auth")
    
    await page.locator('[id="email"]').wait_for(state="visible", timeout=10000)
    await page.locator('[id="email"]').fill(email)
    await page.locator('[id="password"]').fill(password)
    await page.get_by_role('button', name='تسجيل الدخول').click()

    await page.wait_for_url(re.compile("/dashboard"), timeout=30000)

    return True

async def run_all():
    pw = await async_api.async_playwright().start()
    browser = await pw.chromium.launch(headless=False, args=["--no-sandbox", "--disable-setuid-sandbox"])
    context = await browser.new_context()
    context.set_default_timeout(30000)

    # Test with admin
    page = await context.new_page()
    try:
        await run_test(page, "nur.quran.school@gmail.com", "toumi1916")
        print("Admin test: PASSED")
    except Exception as e:
        print(f"Admin test: FAILED - {e}")
    finally:
        await context.close()

    if browser:
        await browser.close()
    if pw:
        await pw.stop()

asyncio.run(run_all())