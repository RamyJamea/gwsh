import sqlite3

def clean_orphans():
    conn = sqlite3.connect('d:\\system\\gwsh\\server\\gwsh.db')
    cursor = conn.cursor()
    
    # 1. Clean order_items without an order
    cursor.execute('DELETE FROM order_items WHERE order_id NOT IN (SELECT id FROM orders);')
    deleted_items = cursor.rowcount
    
    # 2. Clean order_item_extras without an order_item
    cursor.execute('DELETE FROM order_item_extras WHERE order_item_id NOT IN (SELECT id FROM order_items);')
    deleted_item_extras = cursor.rowcount

    # 3. Clean order_histories without an order
    cursor.execute('DELETE FROM order_histories WHERE order_id NOT IN (SELECT id FROM orders);')
    deleted_histories = cursor.rowcount
    
    # 4. Clean order_history_items without an order_history
    cursor.execute('DELETE FROM order_history_items WHERE order_history_id NOT IN (SELECT id FROM order_histories);')
    deleted_history_items = cursor.rowcount
    
    # 5. Clean order_history_item_extras without an order_history_item
    cursor.execute('DELETE FROM order_history_item_extras WHERE order_history_item_id NOT IN (SELECT id FROM order_history_items);')
    deleted_history_item_extras = cursor.rowcount

    print(f"Deleted {deleted_items} orphaned order_items")
    print(f"Deleted {deleted_item_extras} orphaned order_item_extras")
    print(f"Deleted {deleted_histories} orphaned order_histories")
    print(f"Deleted {deleted_history_items} orphaned order_history_items")
    print(f"Deleted {deleted_history_item_extras} orphaned order_history_item_extras")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    clean_orphans()
