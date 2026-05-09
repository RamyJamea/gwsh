import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'gwsh.db')
    print(f"Using DB: {db_path}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Check if grid_x and grid_y columns already exist
    c.execute("PRAGMA table_info(tables);")
    columns = c.fetchall()
    column_names = [col[1] for col in columns]
    
    added_columns = False
    if 'grid_x' not in column_names:
        print("Adding grid_x column to tables...")
        c.execute("ALTER TABLE tables ADD COLUMN grid_x INTEGER NOT NULL DEFAULT 0;")
        added_columns = True
        
    if 'grid_y' not in column_names:
        print("Adding grid_y column to tables...")
        c.execute("ALTER TABLE tables ADD COLUMN grid_y INTEGER NOT NULL DEFAULT 0;")
        added_columns = True
        
    if added_columns:
        # Give tables a basic sequence layout so they don't all stack at (0,0) initially
        c.execute("SELECT id, branch_id FROM tables ORDER BY branch_id, id;")
        tables = c.fetchall()
        
        updates = []
        for index, (table_id, branch_id) in enumerate(tables):
            grid_x = index % 5
            grid_y = index // 5
            updates.append((grid_x, grid_y, table_id))
            
        c.executemany("UPDATE tables SET grid_x = ?, grid_y = ? WHERE id = ?", updates)
        print(f"Updated {len(updates)} tables with initial grid positions.")
    else:
        print("Columns grid_x and grid_y already exist.")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
