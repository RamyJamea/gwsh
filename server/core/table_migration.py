import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'gwsh.db')
    print(f"Using DB: {db_path}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Check if table_number column already exists
    c.execute("PRAGMA table_info(tables);")
    columns = c.fetchall()
    column_names = [col[1] for col in columns]
    
    if 'table_number' not in column_names:
        print("Adding table_number column to tables...")
        # Make the column nullable as requested
        c.execute("ALTER TABLE tables ADD COLUMN table_number INTEGER NULL;")
        
        # Backfill sequentially per branch
        c.execute("SELECT id, branch_id FROM tables ORDER BY branch_id, id;")
        tables = c.fetchall()
        
        counts = {}
        updates = []
        for table_id, branch_id in tables:
            counts[branch_id] = counts.get(branch_id, 0) + 1
            table_number = counts[branch_id]
            updates.append((table_number, table_id))
            
        c.executemany("UPDATE tables SET table_number = ? WHERE id = ?", updates)
        
        print(f"Updated {len(updates)} tables with sequential table_numbers.")
    else:
        print("Column table_number already exists.")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
