
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** backend
- **Date:** 2026-06-24
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 postapiauthloginwithvalidcredentials
- **Test Code:** [TC001_postapiauthloginwithvalidcredentials.py](./TC001_postapiauthloginwithvalidcredentials.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 24, in <module>
  File "<string>", line 16, in test_post_api_auth_login_with_valid_credentials
AssertionError: Expected status code 200, got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/300b8716-4e7c-4ab5-8175-fdce991d16b5/7f5fbe7b-a808-4b02-839d-237c401e7ff2
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 getapistudentswithvalidtoken
- **Test Code:** [TC002_getapistudentswithvalidtoken.py](./TC002_getapistudentswithvalidtoken.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 17, in <module>
  File "<string>", line 11, in test_get_api_students_with_valid_token
AssertionError: Expected status code 200, got 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/300b8716-4e7c-4ab5-8175-fdce991d16b5/b7efdb20-3558-436b-bfc0-9440cabb0c0a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 getapiclasseswithvalidtoken
- **Test Code:** [TC003_getapiclasseswithvalidtoken.py](./TC003_getapiclasseswithvalidtoken.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 16, in test_get_api_classes_with_valid_token
  File "/var/lang/lib/python3.12/site-packages/requests/models.py", line 1024, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 401 Client Error: Unauthorized for url: http://localhost:8000/api/auth/login

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 52, in <module>
  File "<string>", line 18, in test_get_api_classes_with_valid_token
AssertionError: Login request failed: 401 Client Error: Unauthorized for url: http://localhost:8000/api/auth/login

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/300b8716-4e7c-4ab5-8175-fdce991d16b5/47442c25-528e-4ec2-8d1b-a848839bd0b0
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---