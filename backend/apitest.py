import requests

url = "http://localhost:5000/api/change-password"  # Adjust host/port if needed

payload = {
    "email": "user@example.com",        # Replace with a real email in your DB
    "new_password": "newSecurePass123"  # Your new password to test
}

response = requests.post(url, json=payload)

print("Status Code:", response.status_code)
print("Response JSON:", response.json())
