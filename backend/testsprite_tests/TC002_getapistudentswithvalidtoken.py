import requests

def test_get_api_students_with_valid_token():
    base_url = "http://localhost:8000"

    # First, authenticate to get a valid token
    login_payload = {
        "email": "admin@qsm.com",
        "password": "password"
    }
    try:
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_payload, timeout=30)
        assert login_response.status_code == 200, f"Login failed: {login_response.status_code}"
        login_data = login_response.json()
        assert login_data.get("success"), "Login unsuccessful"
        api_key_value = login_data["data"]["token"]
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    headers = {
        "Authorization": f"Bearer {api_key_value}"
    }
    try:
        response = requests.get(f"{base_url}/api/students", headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_data = response.json()
        assert json_data.get("success"), "Response unsuccessful"
        assert isinstance(json_data["data"]["data"], list), "Response JSON is not a list of students"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_students_with_valid_token()
