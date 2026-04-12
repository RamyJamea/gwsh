import sqlite3
import pandas as pd

def check_history():
    conn = sqlite3.connect('d:\\system\\gwsh\\server\\gwsh.db') # Assuming it's gwsh.db or database.db
    try:
        df_orders = pd.read_sql_query("SELECT id, table_id, action FROM orders", conn)
        df_history = pd.read_sql_query("SELECT id, order_id, action FROM order_histories", conn)
        print("ORDERS:")
        print(df_orders.head(10))
        print("\nHISTORY:")
        print(df_history.head(20))
    except Exception as e:
        print(e)
    finally:
        conn.close()

if __name__ == "__main__":
    check_history()
