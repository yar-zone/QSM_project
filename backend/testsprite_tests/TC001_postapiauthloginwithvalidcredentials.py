import requests

def test_post_api_auth_login_with_valid_credentials():
    base_url = "http://localhost:8000"
    url = f"{base_url}/api/auth/login"
    headers = {
        "Content-Type": "application/json"
    }
    # Real seeded admin credentials from DatabaseSeeder
    payload = {
        "email": "admin@qsm.com",
        "password": "password"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Response structure: { success: true, data: { user: {...}, token: "..." }, message: "..." }
    json_resp = response.json()
    assert json_resp.get("success") is True, "Expected success=true in response"

    token = None
    data = json_resp.get("data", {})
    if "token" in data and isinstance(data["token"], str) and data["token"]:
        token = data["token"]
    elif "access_token" in data and isinstance(data["access_token"], str) and data["access_token"]:
        token = data["access_token"]

    assert token is not None, f"Sanctum token not found in response. Response: {json_resp}"
    assert len(token) > 10, f"Token seems too short: {token}"

    print(f"Login successful. Token: {token[:20]}...")

if __name__ == "__main__":
    test_post_api_auth_login_with_valid_credentials()