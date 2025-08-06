## Application Architecture

The application follows a modern server-centric approach using the Next.js App Router. This architecture separates the UI (client-side) from the business logic (server-side), enhancing security and maintainability.

### Database Schema

The database is the single source of truth, managed by Prisma. The schema (`prisma/schema.prisma`) defines the tables and their relationships.

**Table Relationships (Flow Chart):**

```
[Supplier]--< (one-to-many) --[InventoryItem]--< (one-to-many) --[Item (in a sale)]
                                   |
                                   ^
[Category]--< (one-to-many) -------+

[Customer]--< (one-to-many) --[Sale]--< (one-to-many) --[Item (in a sale)]
    |
    +--< (one-to-many) --[LedgerPayment]

[BusinessProfile] (Singleton - one record for the whole app)

[CashbookEntry] (Independent log of cash in/out)
```

**Table Explanations:**
*   **`BusinessProfile`**: Stores the shop's details (name, address, etc.). There will only ever be one record in this table.
*   **`Supplier`**: Stores information about the businesses that supply inventory items.
*   **`Category`**: Stores inventory categories (e.g., "Snacks", "Drinks") to help organize products.
*   **`InventoryItem`**: The master list of all products the business sells. It has relationships with `Supplier` and `Category`.
*   **`Customer`**: Stores customer details, primarily for tracking udhaar (credit). The phone number serves as a unique identifier.
*   **`Sale`**: Records every sale transaction, linking to the `Customer` who made the purchase and the items sold.
*   **`Item`**: Records each specific item within a `Sale`. This table stores a snapshot of the item's details at the time of sale.
*   **`LedgerPayment`**: Records payments made by customers against their outstanding udhaar balance.
*   **`CashbookEntry`**: A simple log for tracking all cash inflows (like sales) and outflows (like expenses).

---

### Detailed Table Schemas

Here is a detailed breakdown of each table in the database.

#### `BusinessProfile`
Stores the single profile for the business owner's shop.

| Column Name   | Data Type | Constraints    | Description                                                    |
|---------------|-----------|----------------|----------------------------------------------------------------|
| `id`          | `Int`     | Primary Key    | The unique identifier, fixed to `1` for a single profile.      |
| `shopName`    | `String`  | Not Null       | The name of the shop, displayed on receipts and reports.       |
| `fullAddress` | `String`  | Not Null       | The physical address of the business.                          |
| `phoneNumber` | `String`  | Not Null       | The contact phone number for the business.                     |
| `upiId`       | `String`  | Not Null       | The UPI ID used for generating payment QR codes.               |
| `gstin`       | `String`  | Nullable       | The 15-character GST Identification Number, if applicable.     |

#### `Customer`
Stores information about customers, identified by their phone number.

| Column Name | Data Type | Constraints | Description                                                      |
|-------------|-----------|-------------|------------------------------------------------------------------|
| `phone`     | `String`  | Primary Key | The customer's 10-digit phone number, serving as the unique ID.    |
| `name`      | `String`  | Not Null    | The full name of the customer.                                   |

#### `Category`
Stores product categories for organizing inventory.

| Column Name | Data Type | Constraints               | Description                                |
|-------------|-----------|---------------------------|--------------------------------------------|
| `id`        | `Int`     | Primary Key, Autoincrement| A unique identifier for the category.      |
| `name`      | `String`  | Not Null, Unique          | The name of the category (e.g., "Drinks"). |

#### `Supplier`
Stores information about product suppliers.

| Column Name          | Data Type | Constraints               | Description                                           |
|----------------------|-----------|---------------------------|-------------------------------------------------------|
| `id`                 | `Int`     | Primary Key, Autoincrement| A unique identifier for the supplier.                 |
| `companyName`        | `String`  | Not Null                  | The name of the supplier's company.                   |
| `companyPhone`       | `String`  | Not Null                  | The main contact number for the supplier company.     |
| `companyAddress`     | `String`  | Not Null                  | The address of the supplier.                          |
| `pincode`            | `String`  | Not Null                  | The 6-digit pincode for the supplier's address.       |
| `contactPersonName`  | `String`  | Nullable                  | The name of a specific contact person at the company. |
| `contactPersonPhone` | `String`  | Nullable                  | The phone number of the specific contact person.      |

#### `InventoryItem`
The master table for all products available for sale.

| Column Name     | Data Type  | Constraints                | Description                                                          |
|-----------------|------------|----------------------------|----------------------------------------------------------------------|
| `id`            | `Int`      | Primary Key, Autoincrement | A unique identifier for the inventory item.                          |
| `name`          | `String`   | Not Null                   | The name of the product (e.g., "Parle-G Biscuit").                 |
| `stock`         | `Int`      | Not Null, Default: 0       | The current quantity of this item in stock.                          |
| `purchasePrice` | `Decimal`  | Not Null, Default: 0       | The price at which the item was purchased from the supplier.         |
| `price`         | `Decimal`  | Not Null, Default: 0       | The price at which the item is sold to the customer.                 |
| `expiryDate`    | `DateTime` | Nullable                   | The expiration date of the product batch, if applicable.             |
| `createdAt`     | `DateTime` | Not Null, Default: now()   | Timestamp of when the item was first added to the inventory.         |
| `updatedAt`     | `DateTime` | Not Null, @updatedAt       | Timestamp of when the item record was last updated.                  |
| `categoryId`    | `Int`      | Foreign Key (`Category`)   | Links the item to a `Category`.                                      |
| `supplierId`    | `Int`      | Foreign Key (`Supplier`), Nullable | Links the item to a `Supplier`.                                  |

#### `Sale`
Records the metadata for each transaction.

| Column Name      | Data Type       | Constraints              | Description                                                          |
|------------------|-----------------|--------------------------|----------------------------------------------------------------------|
| `id`             | `String`        | Primary Key              | A unique identifier for the sale transaction.                        |
| `date`           | `DateTime`      | Not Null, Default: now() | The exact date and time the sale was made.                           |
| `totalAmount`    | `Decimal`       | Not Null                 | The final amount paid by the customer after any discounts.           |
| `discountAmount` | `Decimal`       | Nullable, Default: 0     | The amount of discount applied to this sale.                         |
| `paymentMethod`  | `PaymentMethod` | Not Null                 | The method of payment (`Cash`, `UPI`, or `Udhaar`).                  |
| `customerId`     | `String`        | Foreign Key (`Customer`) | The phone number of the customer who made the purchase.              |

#### `Item`
Records the specific products sold within a single `Sale`.

| Column Name       | Data Type | Constraints                   | Description                                                             |
|-------------------|-----------|-------------------------------|-------------------------------------------------------------------------|
| `id`              | `Int`     | Primary Key, Autoincrement    | A unique identifier for the line item within the database.              |
| `name`            | `String`  | Not Null                      | A snapshot of the item's name at the time of sale.                      |
| `quantity`        | `Int`     | Not Null                      | The number of units of this item sold in the transaction.               |
| `price`           | `Decimal` | Not Null                      | A snapshot of the item's unit price at the time of sale.                |
| `total`           | `Decimal` | Not Null                      | The total price for this line item (`quantity` * `price`).              |
| `saleId`          | `String`  | Foreign Key (`Sale`)          | Links this line item back to its parent `Sale` record.                  |
| `inventoryItemId` | `Int`     | Foreign Key (`InventoryItem`) | Links back to the master `InventoryItem` for stock tracking.            |

#### `LedgerPayment`
Tracks payments made by customers against their credit (udhaar) balance.

| Column Name  | Data Type  | Constraints              | Description                                                    |
|--------------|------------|--------------------------|----------------------------------------------------------------|
| `id`         | `String`   | Primary Key              | A unique identifier for the payment transaction.               |
| `date`       | `DateTime` | Not Null, Default: now() | The exact date and time the payment was received.              |
| `customerId` | `String`   | Foreign Key (`Customer`) | The phone number of the customer who made the payment.         |
| `amount`     | `Decimal`  | Not Null                 | The amount of money paid by the customer.                      |
| `notes`      | `String`   | Nullable                 | Optional notes about the payment (e.g., "Paid via friend").    |

#### `CashbookEntry`
A log of all cash inflows and outflows for the business.

| Column Name     | Data Type              | Constraints              | Description                                                      |
|-----------------|------------------------|--------------------------|------------------------------------------------------------------|
| `id`            | `String`               | Primary Key              | A unique identifier for the cashbook transaction.                |
| `date`          | `DateTime`             | Not Null, Default: now() | The exact date and time of the transaction.                      |
| `type`          | `'in' | 'out'`         | Not Null                 | Whether the transaction was cash 'in' (income) or 'out' (expense). |
| `amount`        | `Decimal`              | Not Null                 | The value of the transaction.                                    |
| `description`   | `String`               | Not Null                 | A brief description of the transaction (e.g., "Office supplies"). |
| `paymentMethod` | `ExpensePaymentMethod` | Nullable                 | The payment method used for the expense (`Cash`, `Card`, `UPI`).   |

---
### Data Flow

The application uses a clean, unidirectional data flow pattern powered by React Hooks and Next.js Server Actions.

1.  **UI Components (Client-Side):** Pages like `Inventory` (`/src/app/inventory/page.tsx`) are rendered on the client. They do not contain business logic.

2.  **React Hooks (Client-Side):** The UI components use custom hooks (e.g., `useInventory` from `/src/hooks/use-inventory.ts`). These hooks are responsible for managing the client-side state of the data.

3.  **Server Actions (Server-Side):** When a user performs an action (like adding an item), the hook calls a **Server Action** (e.g., `addInventoryItem` from `/src/app/inventory/inventory-actions.ts`).

4.  **Prisma Client (Server-Side):** The Server Action, which runs exclusively on the server, uses the **Prisma Client** to securely interact with the PostgreSQL database. It performs the necessary create, read, update, or delete (CRUD) operations.

5.  **Data Return & State Update:** The result of the database operation is returned from the Server Action back to the hook on the client. The hook then updates its state, causing the UI to re-render with the new data.

This architecture keeps the frontend clean and delegates all business and database logic to the server, enhancing security and performance.

---

## Core Features

### Calculator & Billing System
*   **What:** The central feature of the application, a powerful on-screen calculator that seamlessly transitions into a billing system.
*   **How:** The calculator supports standard arithmetic, memory functions, and special keys. Pressing the "Sales/Bill" key switches it into billing mode. In this mode, you can add items by their ID, apply discounts, select payment methods, and finalize sales.
*   **Files:**
    *   `src/app/page.tsx`: Main entry point for the calculator.
    *   `src/components/biz-calc/Calculator.tsx`: The core component managing all state and logic.
    *   `src/components/biz-calc/DisplayScreen.tsx`: Renders the bill, items, totals, and other modes.
    *   `src/app/sales/actions.ts`: Server action that processes and saves the final sale to the database.

### Inventory Management
*   **What:** A comprehensive interface to manage all products, their stock levels, pricing, categories, and suppliers.
*   **How:** You can view your entire inventory, filter by category, and search for items. The interface provides at-a-glance information on stock status, profit margins, and expiry dates. You can add, edit, or delete items and categories. Clicking an item row opens a detailed pop-up. Column headers for ID, Name, and dates are sortable.
*   **Files:**
    *   `src/app/inventory/page.tsx`: The main UI for the inventory dashboard and list.
    *   `src/hooks/use-inventory.ts` & `src/hooks/use-categories.ts`: Client-side state management.
    *   `src/app/inventory/inventory-actions.ts` & `src/app/inventory/category-actions.ts`: Server Actions for database operations.

### Customer & Ledger (Udhaar) Management
*   **What:** Tools to manage customers who purchase on credit (udhaar).
*   **How:** The **Ledger** page lists all customers with an outstanding balance. You can view a detailed transaction history for each customer (debits for sales, credits for payments) and record new payments. The **Customers** page provides a complete list of all customers, their total spending, and current udhaar status.
*   **Files:**
    *   `src/app/ledger/page.tsx`: UI for managing outstanding balances.
    *   `src/app/customers/page.tsx`: UI for the master customer list.
    *   `src/hooks/use-customers.ts` & `src/hooks/use-ledger-payments.ts`: State management.
    *   `src/app/ledger/actions.ts` & `src/app/customers/actions.ts`: Server Actions for the database.

### Cashbook
*   **What:** A simple digital ledger to track all cash inflows and outflows.
*   **How:** The Cashbook automatically records all cash sales as "Cash In". You can also manually add other income ("Cash In") or log expenses ("Cash Out"). The page provides filters for date range and payment method, with summary cards that update dynamically.
*   **Files:**
    *   `src/app/cashbook/page.tsx`: The UI for the cashbook ledger.
    *   `src/hooks/use-cashbook.ts`: State management.
    *   `src/app/cashbook/actions.ts`: Server Actions.

### Suppliers
*   **What:** A dedicated page to manage supplier information.
*   **How:** You can add, view, edit, and delete supplier details, including company information and contact person details. This information is then available to be linked to inventory items.
*   **Files:**
    *   `src/app/suppliers/page.tsx`: The main UI for the supplier list.
    *   `src/hooks/use-suppliers.ts`: State management.
    *   `src/app/suppliers/actions.ts`: Server Actions.

### Dashboard & Reports
*   **What:** Visual overviews of your business performance.
*   **How:** The **Dashboard** provides a high-level snapshot with a gauge chart for profitability and cards for key metrics like revenue, sales, and new customers. The **Reports** page offers detailed, filterable tables for sales, inventory, and expenses. You can download PDF receipts for individual sales or generate a comprehensive, AI-summarized business report.
*   **Files:**
    *   `src/app/dashboard/page.tsx`: The main dashboard UI.
    *   `src/app/reports/page.tsx`: The detailed reports UI.
    *   `src/lib/pdf-generator.ts` & `src/lib/report-pdf-generator.ts`: Logic for creating PDFs.

### Business Profile
*   **What:** A page to set up your shop's information.
*   **How:** Here you can enter your shop's name, address, phone number, UPI ID, and GSTIN. This information is used across the app, especially for generating receipts and reports.
*   **Files:**
    *   `src/app/profile/page.tsx`: The profile settings form.
    *   `src/hooks/use-business-profile.ts`: State management.
    *   `src/app/profile/actions.ts`: Server Actions.

### AI-Powered Features
*   **What:** Smart features using Genkit to provide intelligent insights.
*   **How:**
    *   **Smart Discount Suggestions:** The app can analyze a customer's purchase history and the current bill total to suggest an optimal discount.
    *   **Report Summaries:** When generating a report, the app analyzes the sales data and uses AI to provide a concise summary, key insights, and actionable suggestions.
*   **Files:**
    *   `src/ai/flows/`: Contains all Genkit flow definitions.
    *   `src/app/reports/page.tsx`: Calls the `generateReportSummary` flow.
    *   `src/components/biz-calc/Calculator.tsx`: Calls the `suggestDiscount` flow.
