# SwiftBill - Free & Open-Source Invoice Generator

SwiftBill is a modern, easy-to-use application for creating and managing professional quotations, invoices, receipts, and bills. It's built with Next.js and Tailwind CSS, runs entirely on your local machine, and uses a local SQLite database to store your data, ensuring your information stays private.

<img src="./screenshot/Screenshot 2025-08-06 173804.png" alt="SwiftBill Screenshot" />

## Features

- **Multiple Document Types**: Seamlessly switch between creating Quotations, Invoices, Receipts, and Bills.
- **Client & Customer Management**: Easily input and manage details for your clients and customers.
- **Dynamic Item Lists**: Add, edit, and remove line items with descriptions, quantities, and prices. Totals are calculated automatically.
- **Tax & Discount Calculation**: Apply discounts and GST to quotations.
- **Live Preview**: See a real-time preview of your document as you type.
- **PDF Download**: Download professional, print-ready A4 PDFs of your documents.
- **Persistent Local Storage**: All your company info and saved records are stored in a local SQLite database file (`database.db`).
- **Company Profile**: Set up your company details, including your logo and signature, which will appear on all documents.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)
- **Database**: [SQLite](https://www.sqlite.org/index.html)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) & [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) (version 18 or higher) and `npm` installed on your computer.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    https://github.com/Amal-AM4/swiftbill.git
    cd swiftbill
    ```

2.  **Install dependencies:**
    This will install all the necessary packages for the project.
    ```bash
    npm install
    ```

3.  **Run the development server:**
    This command starts the local development server.
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) in your browser to see the application. The app will automatically reload if you make changes to the code.

4.  **Build for production:**
    To create a production-ready version of the app, run:
    ```bash
    npm run build
    ```
    This bundles the app into static files for deployment. You can run the production build locally with `npm start`.

## Project Structure & Customization

If you want to customize the application, here are the key files you'll want to look at:

-   `src/app/page.tsx`: This is the main component for the application's user interface. Most of the form logic and state management happens here.
-   `src/app/records/page.tsx`: This is the UI for the "Saved Records" page.
-   `src/components/invoice-preview.tsx`: This React component generates the live preview of the invoice/quotation that you see on the screen.
-   `src/lib/pdf-generator.ts`: This file contains all the logic for generating the final PDF document. If you want to change the PDF's appearance (colors, fonts, layout), this is the place to do it.
-   `src/app/globals.css`: This file defines the core theme colors for the application using CSS variables. You can change the app's color scheme by editing the HSL values here.
-   `src/lib/db.ts`: This file defines the SQLite database schema. If you want to add new fields or tables, you must modify the `CREATE TABLE` statements here.
-   `src/app/api/`: This directory contains the server-side API routes that connect the frontend to the SQLite database.

## Database Schema

SwiftBill uses a local `database.db` file to store all data. The schema is defined in `src/lib/db.ts` and consists of three main tables:

### `company_info` Table
Stores your company profile information.

| Column                        | Type    | Description                                  |
| ----------------------------- | ------- | -------------------------------------------- |
| `id`                          | INTEGER | Primary Key (always 1)                       |
| `name`                        | TEXT    | Company Name                                 |
| `logo`                        | TEXT    | Base64 encoded logo image data URL           |
| `gstin`                       | TEXT    | GST Identification Number                    |
| `address`                     | TEXT    | Company's physical address                   |
| `contact`                     | TEXT    | Phone number                                 |
| `email`                       | TEXT    | Email address                                |
| `website`                     | TEXT    | Company website URL                          |
| `upiId`                       | TEXT    | UPI ID for payments                          |
| `authorizedSignatoryName`     | TEXT    | Name of the authorized signatory             |
| `authorizedSignatoryDesignation` | TEXT    | Designation of the signatory (e.g., Founder) |
| `signature`                   | TEXT    | Base64 encoded signature image data URL      |

### `quotations` Table
Stores all saved quotation documents.

| Column                | Type    | Description                                  |
| --------------------- | ------- | -------------------------------------------- |
| `id`                  | INTEGER | Primary Key, Auto-incrementing             |
| `quotationNumber`     | TEXT    | Unique quotation number (e.g., QUO-2024-123) |
| `date`                | TEXT    | Date of creation (YYYY-MM-DD)                |
| `validUntil`          | TEXT    | Expiry date of the quotation (YYYY-MM-DD)    |
| `clientName`          | TEXT    | Name of the client/company                   |
| ...and other client fields | TEXT | `clientContactPerson`, `clientAddress`, etc. |
| `projectDescription`  | TEXT    | A brief description of the project           |
| `items`               | TEXT    | JSON string of the line items array          |
| `discount`            | REAL    | Discount amount                              |
| `gstPercentage`       | REAL    | GST percentage to apply                      |
| `termsAndConditions`  | TEXT    | Terms and conditions text                    |
| `closingNote`         | TEXT    | A final thank you message                    |
| `createdAt`           | DATETIME| Timestamp of when the record was created     |

### `invoices` Table
Stores all saved invoices, receipts, and bills.

| Column          | Type    | Description                                    |
| --------------- | ------- | ---------------------------------------------- |
| `id`            | INTEGER | Primary Key, Auto-incrementing               |
| `invoiceNumber` | TEXT    | Unique document number (e.g., INV-2024-123)    |
| `mode`          | TEXT    | The document type: 'Invoice', 'Receipt', 'Bill'|
| `date`          | TEXT    | Date of creation (YYYY-MM-DD)                  |
| `customerName`  | TEXT    | Name of the customer                           |
| `customerContact` | TEXT  | Customer's phone or email                      |
| `paymentMode`   | TEXT    | 'UPI', 'Cash', 'Bank Transfer'                 |
| `items`         | TEXT    | JSON string of the line items array            |
| `discount`      | REAL    | Discount amount                                |
| `bottomMessage` | TEXT    | A final message on the invoice                 |
| `createdAt`     | DATETIME| Timestamp of when the record was created       |

---

Feel free to fork the project, create issues, and submit pull requests. We welcome all contributions!
