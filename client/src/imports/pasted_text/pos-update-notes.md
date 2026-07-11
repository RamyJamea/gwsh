Update the existing Restaurant POS & Admin Dashboard prototype.

⚠️ Important:

Keep all previous features unchanged (menu, Trendyol, pricing, etc.)

Add branch selection, table system, and improved order flow

🏢 1. Login Screen Enhancement (Branch Selection)

Update the Login Screen:

Add a required field:

Branch Selection

There are only two branches:

Branch 1

Branch 2

Final Login Fields:

Username

Password

Branch (Dropdown or selection buttons)

🪑 2. Table & Order Destination Selection Screen

After successful login (for Cashier):

Show a new screen:

“Start Order” Screen

The cashier must choose where the order will go:

Section 1: Restaurant Tables

Display 5 tables for the selected branch:

Table 1

Table 2

Table 3

Table 4

Table 5

Table States (Very Important):

Each table should have a visual status:

🟢 Available (no active order)

🟡 Occupied (has active order)

🔵 Selected

Section 2: External Orders

Also show options:

🧴 Attara

🧆 Falafel

🛵 Trendyol

These act as order destinations (no tables)

🍽️ 3. Table-Based Order Flow
When cashier selects a Table:

Open the POS Menu screen

The order is linked to that table

Behavior:

If table is:

🟢 Empty:

Create new order

🟡 Occupied:

Show existing order

Allow:

Add more items

Or press Checkout

➕ 4. Add Items to Table Orders

Same POS interface (menu + cart)

Orders are saved per table

Can add items multiple times

💳 5. Checkout from Table

When cashier clicks Checkout:

Show payment screen

Use existing logic:

Cash (with change calculation)

Card

Discount

Destination rules (if needed)

After payment:

Table becomes:

🟢 Available again

🔁 6. External Orders Flow (Attara / Falafel / Trendyol)

When selecting:

Attara / Falafel / Trendyol

Behavior:

Open POS directly (no table)

Order is NOT linked to a table

Apply existing rules:

No payment inside system

Trendyol uses different pricing

📊 7. Orders Tracking Update

Ensure each order now stores:

Branch

Table Number (if applicable)

Order Destination (Table / Attara / Falafel / Trendyol)

Created By (user)

🧠 UX Requirements

Make flow very fast for cashier

Use:

Large clickable table cards

Clear colors for table states

Keep layout:

Clean

Touch-friendly

🎯 Goal

The system should allow the cashier to:

Log in with their branch

Select:

Table (for dine-in)

Or external destination

Manage orders per table

Easily checkout and free tables

Handle external orders correctly