
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Quotation, Invoice } from '@/lib/types';

// This function maps a row from the 'records' view to the correct object type
const mapRecord = (row: any): (Quotation & {type: 'Quotation'}) | (Invoice & {type: 'Invoice' | 'Receipt' | 'Bill'}) => {
    if (row.type === 'Quotation') {
        return {
            type: 'Quotation',
            quotationNumber: row.number,
            date: row.date,
            validUntil: row.validUntil,
            clientName: row.name,
            clientContactPerson: row.clientContactPerson,
            clientAddress: row.clientAddress,
            clientPhone: row.clientPhone,
            clientEmail: row.clientEmail,
            projectDescription: row.projectDescription,
            items: JSON.parse(row.items),
            discount: row.discount,
            gstPercentage: row.gstPercentage,
            termsAndConditions: row.termsAndConditions,
            closingNote: row.closingNote,
        };
    } else { // Invoice, Receipt, or Bill
         return {
            type: row.type,
            mode: row.mode,
            invoiceNumber: row.number,
            date: row.date,
            customerName: row.name,
            customerContact: row.customerContact,
            paymentMode: row.paymentMode,
            upiId: row.upiId,
            items: JSON.parse(row.items),
            discount: row.discount,
            bottomMessage: row.bottomMessage,
        };
    }
}


export async function GET() {
  try {
    const db = await getDb();
    // Fetch from the 'records' view which combines both tables
    const results = await db.all('SELECT * FROM records ORDER BY createdAt DESC');
    
    // The data is stored as a JSON string, so we need to parse it.
    const records = results.map(mapRecord);

    return NextResponse.json(records);
  } catch (error) {
    console.error('Failed to fetch records:', error);
    return NextResponse.json({ message: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const record: (Quotation & { type: 'Quotation' }) | (Invoice & { type: string }) = await request.json();
    const db = await getDb();

    if (record.type === 'Quotation') {
        const q = record as Quotation;
        await db.run(
            `INSERT INTO quotations (
                quotationNumber, date, validUntil, clientName, clientContactPerson, clientAddress, clientPhone, clientEmail,
                projectDescription, items, discount, gstPercentage, termsAndConditions, closingNote
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            q.quotationNumber, q.date, q.validUntil, q.clientName, q.clientContactPerson, q.clientAddress, q.clientPhone, q.clientEmail,
            q.projectDescription, JSON.stringify(q.items), q.discount, q.gstPercentage, q.termsAndConditions, q.closingNote
        );
    } else {
        const i = record as Invoice;
        await db.run(
            `INSERT INTO invoices (
                invoiceNumber, mode, date, customerName, customerContact, paymentMode, upiId, items, discount, bottomMessage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            i.invoiceNumber, i.mode, i.date, i.customerName, i.customerContact, i.paymentMode, i.upiId, JSON.stringify(i.items), i.discount, i.bottomMessage
        );
    }

    return NextResponse.json({ message: 'Record saved successfully' }, { status: 201 });
  } catch (error) {
    console.error('Failed to save record:', error);
    // Check for unique constraint error
    if ((error as any).code === 'SQLITE_CONSTRAINT' && (error as any).message.includes('UNIQUE')) {
         return NextResponse.json({ message: `Record with this number already exists.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to save record' }, { status: 500 });
  }
}
