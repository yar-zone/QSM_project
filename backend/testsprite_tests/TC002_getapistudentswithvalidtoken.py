import requests

def test_get_api_students_with_valid_token():
    base_url = "http://localhost:8000"

    login_data = {
        "email": "admin@qsm.com",
        "password": "password"
    }

    try:
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data, timeout=30)
        assert login_response.status_code == 200, f"Login failed, expected status 200, got {login_response.status_code}"
        token_json = login_response.json()
        token = token_json.get("data", {}).get("token") or token_json.get("token")
        assert token is not None, "Token not found in response"
        assert isinstance(token, str), "Token is not a string"

        headers = {
            "Authorization": f"Bearer {token}"
        }
        response = requests.get(f"{base_url}/api/students", headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        json_data = response.json()
        # Paginated response wraps data in 'data' key with 'data' array
        students_list = json_data.get("data", {}).get("data") or json_data
        assert isinstance(students_list, list) or isinstance(json_data.get("data"), list), "Response JSON is not a list of students"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    except ValueError:
        assert False, "Response is not valid JSON"

if __name__ == "__main__":
    test_get_api_students_with_valid_token()
