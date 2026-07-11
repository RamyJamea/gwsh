Update the existing Restaurant POS & Admin Dashboard prototype.

⚠️ Important:

Keep all existing features (POS, Trendyol, Attara, Falafel, discounts, etc.)

Extend the system to support:

Two branches

Table-based ordering

Branch-specific pricing

Branch assignment for users

🔐 1. Login Screen Enhancement

Update the Login Screen to include:

Fields:

Username

Password

Branch Selection

Branch Options:

Branch 1

Branch 2

Behavior:

User must select the branch they are working in before logging in

👤 2. User Management Update (Admin)

In Create User / Edit User:

Add:

Assigned Branch

Admin must choose:

Branch 1

Branch 2

Behavior:

Each cashier is assigned to a specific branch

(Optional UX) Prevent login if user selects a different branch

🪑 3. Table Selection Screen (NEW – After Login)

After cashier logs in, show a new screen:

“Order Destination / Table Selection”
Section 1: External Orders

🛵 Trendyol

🧴 Attara

🧆 Falafel

Section 2: Tables (Very Important)

Show 5 tables for the selected branch:

Table 1

Table 2

Table 3

Table 4

Table 5

UI Requirements:

Display tables as cards or buttons

Show status:

🟢 Available

🔴 Occupied

🍽️ 4. Table Order Flow
When cashier selects a table:

Open the POS Menu Screen

Allow:

Add items to that table

Modify existing order

If table already has an order:

Load existing order automatically

Show:

Current items

Total price

Checkout Behavior:

Show “Check Out” button

Complete payment normally (cash/card)

🧾 5. Orders Must Include Branch & Table

Update all order data in UI:

Each order should include:

Branch

Order Destination:

Table (with table number)

OR Trendyol / Attara / Falafel

Created By

📊 6. Orders & Reports Page Update

Enhance the Orders Table:

Add Columns:

Branch

Table Number (if applicable)

Order Destination

Created By

Add Filters:

Filter by Branch

Filter by Table

Filter by Destination

⚙️ 7. Admin Menu Management – Branch-Based Pricing (VERY IMPORTANT)

Enhance menu system:

Prices must now depend on:

Branch

AND Trendyol (if selected)

For each item size, allow Admin to define:

Branch 1 Price

Branch 2 Price

Trendyol Price

Example:

Kunafa (Small):

Branch 1 → 220

Branch 2 → 240

Trendyol → 280

UI Suggestion:

Use table layout:

Size	Branch 1	Branch 2	Trendyol
➕ 8. Add New Item (Admin)

When creating a new item:

Admin must:

Add sizes

Define prices for:

Branch 1

Branch 2

Trendyol

⚠️ Prevent saving without full pricing

🧠 UX Requirements

Keep flow fast for cashier

Tables should be:

Clear

Easy to select

Avoid confusion between:

Table orders

External orders

🎯 Goal

The system should now support:

Two branches with different pricing

Table-based ordering (5 tables per branch)

External partners (Trendyol / Attara / Falafel)

Accurate tracking of:

Branch

Table

Cashier