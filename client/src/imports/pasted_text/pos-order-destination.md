Update the existing Restaurant POS & Admin Dashboard prototype.

⚠️ Important: Keep all previous designs and features unchanged.
Only update the behavior and UI of “Attara (عطارة)” and “Falafel (فلافل)” based on the following corrected business logic.

🧾 Correct Business Concept

“Attara” and “Falafel” are external partner restaurants, not internal cash fields.

Customers may place an order from our restaurant, but:

The order is fulfilled by either Attara or Falafel

The payment is collected at their location, not in our restaurant

Goal:

We need to track:

How much money is:

Collected in our restaurant (normal orders)

Collected at Attara

Collected at Falafel

So we can later settle الحساب (financial reconciliation) with them.

🧩 1. Update Order Type Selection (POS Screen)

Instead of showing “Attara” and “Falafel” as payment fields:

Add an “Order Destination” selector:

When the cashier creates an order, they must choose:

🏠 In-House (Default) → customer pays at our restaurant

🧴 Attara → order goes to Attara, payment collected هناك

🧆 Falafel → order goes to Falafel, payment collected هناك

UI Suggestions:

Use toggle buttons or segmented control at top of POS

Clearly highlight the selected option

💳 2. Modify Checkout Behavior
If “In-House”:

Normal checkout (Cash / Card)

Money is added to restaurant cash balance

If “Attara” or “Falafel”:

Show message:

“Payment will be collected at Attara/Falafel”

Disable or hide payment method buttons

Allow cashier to confirm order only (no payment collection)

📊 3. Update Admin Dashboard (Financial Breakdown)

Add a Daily Financial Summary Section:

Show 3 separate totals:

💰 Cash in Restaurant

Orders paid inside the restaurant

🧴 Cash at Attara

Orders sent to Attara

🧆 Cash at Falafel

Orders sent to Falafel

Also include:

Total number of orders for each category

Visual charts (pie or bar chart)

📄 4. Orders Table Enhancement

In the Orders / Reports شاشة:

Add a column:

Order Destination

In-House / Attara / Falafel

Allow filtering by:

Destination

Date

🧠 UX Requirements

Make the concept very clear to the cashier

Avoid confusion between:

“Where the order goes”

“Where the money is collected”

Use icons and labels to reinforce meaning

🎯 Goal

The system should clearly separate:

Money collected inside the restaurant

Money collected externally by Attara

Money collected externally by Falafel

To support accurate financial tracking and reconciliation.