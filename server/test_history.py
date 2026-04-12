import requests
import json
import time

def run_test():
    # Login
    r = requests.post("http://127.0.0.1:8000/api/v1/auth/login", data={"username": "admin", "password": "securepassword"})
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check menu items
    r = requests.get("http://127.0.0.1:8000/api/v1/menu-items/branch/1", headers=headers)
    mi_id = r.json()[0]["id"]
    
    # Create takeaway order 1
    order1_data = {
        "cashier_id": 1,
        "branch_id": 1,
        "table_id": None,
        "total_amount": 10.0,
        "action": "create",
        "payment_method": "cash",
        "items": [
            {
                "menu_item_id": mi_id,
                "quantity": 1,
                "price_at_time": 10.0,
                "extras": []
            }
        ]
    }
    r = requests.post("http://127.0.0.1:8000/api/v1/orders/", json=order1_data, headers=headers)
    print("Order 1:", r.json())
    o1_id = r.json()["id"]
    
    requests.post(f"http://127.0.0.1:8000/api/v1/orders/{o1_id}/checkout", json={"payment_method": "cash"}, headers=headers)
    
    time.sleep(1)
    
    # Create takeaway order 2
    r = requests.post("http://127.0.0.1:8000/api/v1/orders/", json=order1_data, headers=headers)
    print("Order 2:", r.json())
    o2_id = r.json()["id"]
    requests.post(f"http://127.0.0.1:8000/api/v1/orders/{o2_id}/checkout", json={"payment_method": "cash"}, headers=headers)
    
    # View history for order 1
    r = requests.get(f"http://127.0.0.1:8000/api/v1/history/orders/{o1_id}", headers=headers)
    print("\nHistory 1:", json.dumps(r.json(), indent=2))
    
    # View history for order 2
    r = requests.get(f"http://127.0.0.1:8000/api/v1/history/orders/{o2_id}", headers=headers)
    print("\nHistory 2:", json.dumps(r.json(), indent=2))

if __name__ == "__main__":
    run_test()
