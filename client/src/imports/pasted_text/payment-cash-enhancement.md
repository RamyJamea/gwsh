Update the existing Payment / Checkout screen in the Restaurant POS prototype.

⚠️ Important:

Keep all existing features unchanged

Only enhance the Cash payment flow

💵 1. Add “Cash Payment Details” Section

When the cashier selects Cash as the payment method:

Show a new section:

Fields:

Total Amount (already exists)

Amount Paid by Customer

Change (Remaining Amount to Return)

⚙️ 2. Behavior & Calculation
Input:

Cashier enters:

“Amount Paid by Customer”

System should automatically calculate:

Change = Amount Paid – Total Amount

Example:

Total = 150 EGP

Paid = 200 EGP

Change = 50 EGP

⚠️ 3. Validation Cases

Handle these cases clearly:

Case 1: Paid أقل من الإجمالي

Show warning:

“Insufficient amount”

Disable “Confirm Payment”

Case 2: Paid = Total

Change = 0

Normal confirmation

Case 3: Paid أكبر من الإجمالي

Show calculated change clearly

🎯 4. UI Design Requirements

Make numbers large and easy to read

Highlight:

Change amount (very clear for cashier)

Use:

Input field for paid amount

Auto-updating change field

⚡ 5. Quick Cash Buttons (Optional but Recommended)

Add quick buttons for common amounts:

+50

+100

+200

This helps cashier work faster

🧠 UX Focus

Fast input for cashier

Zero confusion

Clear visibility of:

What customer paid

What must be returned

🎯 Goal

The cashier should be able to:

Enter the amount received from the customer

Instantly see how much change to return

Avoid mistakes in cash handling