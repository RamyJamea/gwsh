# Floor Plan & Layout Redesign Plan

This plan outlines the removal of the sidebar for cashiers to enforce a pure floor-first experience, alongside a major backend and frontend upgrade to support a realistic, visual drag-and-drop floor plan for admins.

## Goal
To give the cashier an edge-to-edge floor plan interface by removing the sidebar entirely, and to upgrade the "Tables" view into a grid layout where admins can drag, drop, and visually arrange table cards based on their location.

## User Review Required
Please review the proposed backend database changes and frontend drag-and-drop logic.
> [!IMPORTANT]
> To support custom table positions, I will need to add two new columns to the `tables` database table (`grid_x` and `grid_y`). I will create and run a migration script for this. Does this approach work for you?
> Also, what size grid should we use for the floor plan? (e.g., 10x10, 8x12). By default, I will implement a responsive 10x10 grid.

## Proposed Changes

### 1. Cashier Layout Simplification (`Layout.jsx` & `Topbar.jsx`)
- **Hide Sidebar**: Update `Layout.jsx` to completely omit the `<Sidebar>` component if the user is a cashier.
- **Full Width**: Ensure `Layout.css` expands the main content area to 100% width when the sidebar is hidden.
- **Relocate Logout**: Since the sidebar contains the logout button, add a new "Logout" button directly to the `Topbar.jsx` for cashiers. Hide the hamburger menu toggle as well.

### 2. Backend Schema Updates (`branch_model.py` & `branch_schema.py`)
- **Models**: Add `grid_x: Mapped[int]` and `grid_y: Mapped[int]` (default 0) to the `RestaurantTable` model.
- **Schemas**: Update `TableBase` and `TableUpdate` to accept `grid_x` and `grid_y` integers.
- **Migration**: Write and execute a Python script (`migrate_tables_grid.py`) using `sqlite3` to add these two columns to your existing `gwsh.db`.

### 3. Visual Grid Floor Plan (`Tables.jsx`)
- **Grid Container**: Replace the standard wrapping flexbox with a fixed CSS Grid representing the restaurant floor (e.g. 10x10).
- **Table Display**: Each table will be represented as a uniform card within the grid cell, displaying the table number and status.
- **Admin Edit Mode**: Add a toggle for Admins: "Edit Floor Layout".
  - When enabled, table cards become draggable.
  - The floor displays empty drop zones.
  - Dropping a table triggers a `PATCH /api/v1/tables/{id}` request to update the backend with the new `grid_x` and `grid_y` coordinates.

## Verification Plan
1. **Automated / Manual Testing**: 
   - Verify that logging in as a Cashier shows a full-screen layout with no sidebar, and the logout button works from the Topbar.
   - Verify the database migration runs cleanly without corrupting existing data.
   - Log in as an Admin, enter "Edit Floor Layout" mode, drag a table to a new location, refresh the page, and verify it stays in the exact same spot.
   - Verify that tables render uniformly as cards within the grid.
