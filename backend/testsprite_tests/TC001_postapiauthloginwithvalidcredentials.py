import requests

BASE_URL = "http://localhost:8000"

def test_post_api_auth_login_with_valid_credentials():
    url = f"{BASE_URL}/api/auth/login"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "email": "admin@qsm.com",
        "password": "password"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_resp = response.json()
        assert isinstance(json_resp, dict), "Response is not a JSON object"
        assert json_resp.get("success"), "Login unsuccessful"
        token = json_resp.get("data", {}).get("token")
        assert token and isinstance(token, str), "Token not found or invalid in response"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_auth_login_with_valid_credentials()