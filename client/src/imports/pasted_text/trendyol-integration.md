Update the existing Restaurant POS & Admin Dashboard prototype.

⚠️ Important:

Keep all previous features and designs unchanged.

Extend the system to support a new external partner: Trendyol (delivery platform).

🧾 1. Business Concept

Add Trendyol as a third external order destination, similar to:

Attara

Falafel

Behavior:

A Trendyol driver (delivery person) comes to the restaurant.

The cashier creates the order normally using the POS.

The order is NOT paid in the restaurant.

Payment is handled externally by Trendyol.

Key Difference:

Trendyol uses a different menu with higher prices than the normal restaurant menu.

🧩 2. Update Order Destination Selector (POS)

Extend the existing Order Destination الخيارات to include:

🏠 In-House (default)

🧴 Attara

🧆 Falafel

🛵 Trendyol

UI:

Keep same style (toggle / segmented buttons)

Add an icon for Trendyol (delivery/scooter style)

🍽️ 3. Dynamic Menu Pricing (Very Important)

When Trendyol is selected:

The POS should automatically switch to a separate menu pricing.

Requirements:

Same menu items

BUT with higher prices (Trendyol prices)

UX Behavior:

Prices update instantly when switching destination

Show label:

“Trendyol Pricing فعال”

Prevent confusion:

Visually highlight that prices are different

💳 4. Checkout Behavior (Trendyol)

When “Trendyol” is selected:

Disable payment methods (Cash / Card)

Show message:

“Payment will be collected by Trendyol”

Allow only:

Confirm Order

Same logic as Attara & Falafel

📊 5. Admin Dashboard Updates

In the Financial Summary Section, add:

🛵 Cash via Trendyol

Now totals should be:

💰 Cash in Restaurant

🧴 Cash at Attara

🧆 Cash at Falafel

🛵 Cash via Trendyol

Also include:

Number of Trendyol orders

Revenue from Trendyol (based on its pricing)

📄 6. Orders Table Enhancement

Update the Orders Table:

Add / update:

Order Destination:

In-House / Attara / Falafel / Trendyol

Add filter:

Show only Trendyol orders

⚙️ 7. Admin Menu Management (Pricing Control)

Enhance Menu Management:

For each item, allow Admin to define:

Normal Price (In-House)

Trendyol Price

UI Suggestion:

Each item card shows:

Name

Image

Normal Price

Trendyol Price (editable)

🧠 UX Requirements

Make pricing difference very واضح للكاشير

Prevent mistakes between:

Normal orders

Trendyol orders

Use:

Labels

Color indicators

Clear section titles

🎯 Goal

The system must clearly support:

Multiple order destinations

External payment handling

Different pricing strategies (especially for Trendyol)

Accurate financial tracking across all channels