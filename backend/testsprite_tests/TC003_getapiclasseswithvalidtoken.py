import requests

base_url = "http://localhost:8000"
timeout_seconds = 30


def test_get_api_classes_with_valid_token():
    login_payload = {
        "email": "admin@qsm.com",
        "password": "password"
    }
    try:
        login_resp = requests.post(f"{base_url}/api/auth/login", json=login_payload, timeout=timeout_seconds)
    except requests.RequestException as e:
        assert False, f"Request to POST /api/auth/login failed due to exception: {e}"

    assert login_resp.status_code == 200, f"Expected status code 200 from login but got {login_resp.status_code}"

    try:
        token = login_resp.json()
    except ValueError:
        assert False, "Login response content is not valid JSON"

    token_value = None
    if isinstance(token, dict) and "token" in token:
        token_value = token["token"]
    elif isinstance(token, dict) and "data" in token and "token" in token["data"]:
        token_value = token["data"]["token"]
    elif isinstance(token, str):
        token_value = token
    else:
        assert False, f"Unexpected token format in login response: {token}"

    assert token_value is not None, "Token value is None"

    headers = {
        "Authorization": f"Bearer {token_value}"
    }

    try:
        response = requests.get(f"{base_url}/api/classes", headers=headers, timeout=timeout_seconds)
    except requests.RequestException as e:
        assert False, f"Request to GET /api/classes failed due to exception: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

    try:
        classes_data = response.json()
    except ValueError:
        assert False, "Response content is not valid JSON"

    # Handle paginated response
    if isinstance(classes_data, dict) and "data" in classes_data:
        classes_list = classes_data["data"]
        # If it's pagination, get the actual items
        if isinstance(classes_list, dict) and "data" in classes_list:
            classes_list = classes_list["data"]
    else:
        classes_list = classes_data

    assert isinstance(classes_list, list), "Response JSON is not a list of classes"


if __name__ == "__main__":
    test_get_api_classes_with_valid_token()
