
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

// Define the path for the database file
const DB_PATH = path.join(process.cwd(), 'database.db');

// This function will be a singleton for our database connection
let db: Awaited<ReturnType<typeof open>> | null = null;

export async function getDb() {
    if (!db) {
        // If the database connection doesn't exist, create it.
        db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database,
        });

        // Run migrations to create the necessary tables if they don't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS company_info (
                id INTEGER PRIMARY KEY DEFAULT 1,
                name TEXT,
                logo TEXT,
                gstin TEXT,
                address TEXT,
                contact TEXT,
                email TEXT,
                website TEXT,
                upiId TEXT,
                authorizedSignatoryName TEXT,
                authorizedSignatoryDesignation TEXT,
                signature TEXT
            );

            CREATE TABLE IF NOT EXISTS quotations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quotationNumber TEXT UNIQUE,
                date TEXT,
                validUntil TEXT,
                clientName TEXT,
                clientContactPerson TEXT,
                clientAddress TEXT,
                clientPhone TEXT,
                clientEmail TEXT,
                projectDescription TEXT,
                items TEXT, -- JSON string for items array
                discount REAL,
                gstPercentage REAL,
                termsAndConditions TEXT,
                closingNote TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoiceNumber TEXT UNIQUE,
                mode TEXT, -- Invoice, Receipt, Bill
                date TEXT,
                customerName TEXT,
                customerContact TEXT,
                paymentMode TEXT,
                upiId TEXT,
                items TEXT, -- JSON string for items array
                discount REAL,
                bottomMessage TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );

             -- A view to combine both tables for easy fetching on the records page
            CREATE VIEW IF NOT EXISTS records AS
            SELECT
                'Quotation' as type,
                quotationNumber as number,
                date,
                clientName as name,
                items,
                discount,
                gstPercentage,
                null as mode,
                null as customerContact,
                null as paymentMode,
                null as upiId,
                null as bottomMessage,
                clientContactPerson,
                clientAddress,
                clientPhone,
                clientEmail,
                projectDescription,
                validUntil,
                termsAndConditions,
                closingNote,
                createdAt
            FROM quotations
            UNION ALL
            SELECT
                mode as type,
                invoiceNumber as number,
                date,
                customerName as name,
                items,
                discount,
                null as gstPercentage,
                mode,
                customerContact,
                paymentMode,
                upiId,
                bottomMessage,
                null as clientContactPerson,
                null as clientAddress,
                null as clientPhone,
                null as clientEmail,
                null as projectDescription,
                null as validUntil,
                null as termsAndConditions,
                null as closingNote,
                createdAt
            FROM invoices;
        `);
    }
    return db;
}
