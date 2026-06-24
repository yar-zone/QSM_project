import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def test_get_api_classes_with_valid_token():
    # First, authenticate to get the token
    login_payload = {
        "email": "admin@qsm.com",
        "password": "password"
    }
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    try:
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, headers=headers, timeout=TIMEOUT)
        login_response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Login request failed: {e}"

    assert login_response.status_code == 200, f"Expected login status 200, got {login_response.status_code}"

    try:
        login_data = login_response.json()
    except ValueError:
        assert False, "Login response content is not valid JSON"

    token = login_data.get("data", {}).get("token")
    assert isinstance(token, str) and len(token) > 0, f"Expected valid token string, got {type(token)}"

    auth_headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    try:
        response = requests.get(f"{BASE_URL}/api/classes", headers=auth_headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        classes_data = response.json()
    except ValueError:
        assert False, "Response content is not valid JSON"

    assert classes_data.get("success"), "Response unsuccessful"
    class_list = classes_data.get("data", {}).get("data", [])
    assert isinstance(class_list, list), f"Expected data.data to be a list, got {type(class_list)}"


test_get_api_classes_with_valid_token()
