Update the existing Restaurant Management System UI prototype for a Turkish dessert restaurant POS and Admin Dashboard.

Keep the same friendly, modern, warm design style (beige, brown, cream colors), but apply the following UX and functional changes:

🔁 1. Reorder Menu Categories

Update the order of menu categories in the Cashier POS screen to be:

Desserts

Hot Drinks

Cold Drinks

Milkshakes

Ensure this order is reflected in:

Category sidebar

Navigation tabs

Any dropdown filters

🍰 2. Move Vegan Item into Desserts

Remove the separate “Vegan” category.

Move the Vegan Kunafa item into the Desserts category.

Clearly label it as:

“Vegan Kunafa”

➕ 3. Custom Add-ons Flow for Kunafa

Modify the Desserts ordering experience:

Remove any pre-defined item like “Kunafa with Ice Cream”.

Instead, implement a customization flow:

Step 1: Size Selection

When the cashier selects Kunafa:

Show a modal or screen to choose:

Small

Large

Step 2: Add-ons Screen

After selecting size, show a customization screen with:

Available add-ons:

Add Ice Cream

Add Cream (Ashta)

Behavior:

Each add-on increases the total price

The cashier can:

Add the same add-on multiple times

Combine multiple add-ons

Show:

Quantity controls (+ / -)

Live price update

Design should be:

Clear

Touch-friendly

Fast for cashier use

⚙️ 4. Admin Menu Management

In the Admin Dashboard, add a new section:

“Menu Management”

Allow the Admin to:

Edit item prices

Upload/change item images

Add new items

Remove items

Edit item names and descriptions

Design:

Use editable cards or table layout

Include “Edit” and “Save” actions

Image upload UI

💸 5. Discount System in Payment Screen

Enhance the Payment شاشة:

Add a Discount Control Section:

Discount range: 0% to 50%

Controls:

➕ Increase discount by 5%

➖ Decrease discount by 5%

Behavior:

Each click changes discount by 5%

Show:

Current discount percentage

Discount value in money

Updated final total

Make it:

Very clear visually

Easy for cashier to use quickly

🧾 6. Additional Payment Fields (External Cash Tracking)

In the Checkout area, add two additional buttons/fields next to “Checkout”:

Attara (عطارة)

Falafel (فلافل)

Behavior:

These values:

Can be entered or added by the cashier

Are NOT included in the cashier’s cash drawer

They are used only for tracking/reporting purposes

UI Requirements:

Show them as:

Separate input buttons or quick-add fields

Clearly label:

“Not included in cashier balance”

Include them in:

Reports (Admin Dashboard)

🎯 Design Requirements

Maintain clean and modern POS layout

Ensure fast cashier workflow (minimal clicks)

Use:

Large buttons

Clear typography

Responsive layout

Keep the design:

Friendly

Professional

Realistic for production

📊 Data Realism

Use realistic menu data (prices, items)

Show real values in:

Orders

Discounts

Reports

Include example:

Orders with add-ons

Discount applied

External fields (Attara / Falafel)

🧠 UX Focus

The system must feel:

Fast for the cashier

Easy to understand for new users

Practical for real restaurant use