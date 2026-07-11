Update the existing Admin Dashboard in the Restaurant Management System prototype.

⚠️ Important:

Keep all existing features unchanged

Add a new section for User Management and Activity Tracking

The system still supports only two roles: Admin and Cashier

👤 1. User Management Section

Add a new page in Admin Dashboard:

“User Management”

This page allows the Admin to:

➕ Add New Employee (Cashier)

Button: “+ Add User”

Form fields:

Username

Password

Role (Cashier only)

Button: Create User

🚫 2. Disable / Remove Employee Access

Instead of permanently deleting users, implement:

“Deactivate User” feature

For each user:

Show status:

🟢 Active

🔴 Inactive

Admin can:

Deactivate user (kick them out of the system)

Reactivate user if needed

Behavior:

Inactive users:

Cannot log in

Are still visible in the system for history tracking

📋 3. Users Table UI

Display a table with:

Username

Role (Cashier / Admin)

Status (Active / Inactive)

Created Date

Actions:

Edit

Deactivate / Activate

🕵️ 4. Activity Log (VERY IMPORTANT)

Add a new page:

“Activity Log” or “Audit Log”

This is critical for tracking who did what.

Each log entry should include:

👤 User (who performed the action)

🛠️ Action type

📄 Description

🕒 Date & Time

Example Actions to Track:

Admin created a user

Admin deactivated a user

Cashier created an order

Cashier applied discount

Admin edited menu item

Admin changed prices

Admin updated inventory

Example Log Entry:

“Admin Ahmed created user ‘cashier1’ at 10:30 AM”

“Cashier Mona created order #1025”

“Admin Ahmed updated Kunafa price”

🔍 5. Filtering & Search

Add filters:

By User

By Action Type

By Date

Include:

Search bar

📊 6. Dashboard Summary Widget

On the Admin Dashboard, add a small widget:

“Recent Activity”

Show:

Last 5–10 actions

Quick preview of system activity

🧠 UX Requirements

Make it very clear who did each action

Use:

Icons (👤, 🛠️, 🕒)

Clean table layout

Keep it simple but professional

🔐 Security Notes (UI Level)

Password fields should be:

Hidden (••••••)

Show confirmation when:

Deactivating a user

🎯 Goal

The system should allow the Admin to:

Add new employees

Control access (activate/deactivate users)

Track every important action in the system

Know exactly who did what and when