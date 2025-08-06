
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { CompanyInfo } from '@/lib/types';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.get('SELECT * FROM company_info WHERE id = 1');
    if (result) {
        // Map from DB columns to CompanyInfo object
        const companyInfo: CompanyInfo = {
            name: result.name,
            logo: result.logo,
            gstin: result.gstin,
            address: result.address,
            contact: result.contact,
            email: result.email,
            website: result.website,
            upiId: result.upiId,
            authorizedSignatory: {
                name: result.authorizedSignatoryName,
                designation: result.authorizedSignatoryDesignation,
            },
            signature: result.signature,
        };
      return NextResponse.json(companyInfo);
    }
    return NextResponse.json(null, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch company info:', error);
    return NextResponse.json({ message: 'Failed to fetch company info' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data: CompanyInfo = await request.json();
    const db = await getDb();
    
    await db.run(
      `INSERT OR REPLACE INTO company_info (
        id, name, logo, gstin, address, contact, email, website, upiId, 
        authorizedSignatoryName, authorizedSignatoryDesignation, signature
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      1,
      data.name || null,
      data.logo || null,
      data.gstin || null,
      data.address || null,
      data.contact || null,
      data.email || null,
      data.website || null,
      data.upiId || null,
      data.authorizedSignatory?.name || null,
      data.authorizedSignatory?.designation || null,
      data.signature || null
    );

    return NextResponse.json({ message: 'Company info saved successfully' });
  } catch (error) {
    console.error('Failed to save company info:', error);
    return NextResponse.json({ message: 'Failed to save company info' }, { status: 500 });
  }
}
