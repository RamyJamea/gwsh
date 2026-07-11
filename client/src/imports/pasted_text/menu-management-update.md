Update the existing Admin Dashboard → Menu Management section in the Restaurant Management System prototype.

⚠️ Important:

Keep all previous features working (POS, destinations, Trendyol, etc.)

Focus on improving the menu editing experience and pricing flexibility

🎯 1. Support Multiple Pricing Types (Normal + Trendyol)

Enhance the menu system so that each item supports two pricing modes:

🏠 Normal Price (In-House / Attara / Falafel)

🛵 Trendyol Price (separate and higher)

UI Requirements:

For each menu item:

Show clearly:

Normal Price

Trendyol Price

Allow Admin to:

Edit both prices بسهولة

See both values side by side

📏 2. Support Multiple Sizes per Item (Very Important Fix)

Fix the issue where the admin could not define prices for different sizes.

New Requirement:

Each item can have multiple sizes, for example:

Small

Medium (optional)

Large

For EACH size, Admin must define:

Size Name (editable)

Normal Price

Trendyol Price

Example UI:

Kunafa:

Small → 220 (Normal) / 260 (Trendyol)

Large → 320 (Normal) / 380 (Trendyol)

➕ 3. Improve “Add New Item” Flow

Redesign the Add Item form to be structured and easy to use.

Fields:

Item Name

Category (Desserts / Hot Drinks / Cold Drinks / Milkshakes)

Image Upload

Description (optional)

Sizes Section (Dynamic):

Button: “+ Add Size”

When clicked:

Add new row with:

Size Name

Normal Price

Trendyol Price

Admin can:

Add multiple sizes

Edit sizes

Delete sizes

✏️ 4. Improve Editing Existing Items

When admin clicks Edit Item:

Show all sizes with their:

Normal Price

Trendyol Price

Allow:

تعديل الأسعار

تعديل اسم الحجم

إضافة حجم جديد

حذف حجم

Changes should be:

Clear

Inline editable or via modal

🖼️ 5. Improve Image Management

For each item:

Show current image

Allow:

Upload new image

Replace image

Ensure images are visible in:

POS screen (cashier)

🧠 UX Improvements

Use table or card-based layout for clarity

Group sizes under each item visually

Use labels:

“Normal Price”

“Trendyol Price”

Make it easy to scan and edit quickly

⚠️ Validation Rules

Prevent saving item without:

At least one size

Prices defined for each size

Show clear error messages

🎯 Goal

The Admin should be able to:

Easily add new menu items

Define multiple sizes with different prices

Manage Trendyol pricing separately

Edit everything without confusion

The system should feel like a real professional restaurant CMS (Content Management System).