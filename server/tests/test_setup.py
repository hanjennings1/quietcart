"""Setup test: confirms the test setup itself works."""


def test_check_session_when_logged_out(client):
    """With no one logged in, check_session should return 401."""
    response = client.get("/api/check_session")

    assert response.status_code == 401
    assert response.get_json() == {"error": "Not logged in."}