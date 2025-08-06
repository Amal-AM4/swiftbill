
"use client"

import type { Quotation, CompanyInfo, Invoice } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';

type AnyInvoice = Quotation | Invoice;

interface InvoicePreviewProps {
  id?: string;
  invoice: AnyInvoice;
  companyInfo: CompanyInfo;
  mode: 'Quotation' | 'Invoice' | 'Receipt' | 'Bill';
}

const isQuotation = (invoice: AnyInvoice, mode: string): invoice is Quotation => {
    return mode === 'Quotation';
};

export default function InvoicePreview({ id, invoice, companyInfo, mode }: InvoicePreviewProps) {
    
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Create date object assuming UTC to avoid timezone issues
      const date = new Date(dateString + 'T00:00:00Z');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const renderQuotationDetails = (q: Quotation) => {
    const subtotal = q.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const discountedSubtotal = subtotal - (q.discount || 0);
    const gstAmount = discountedSubtotal * ((q.gstPercentage || 0) / 100);
    const grandTotal = discountedSubtotal + gstAmount;
    
    return (
        <>
            {/* Row 1: Title, Logo, and Doc Details */}
            <header className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-bold text-primary mb-4">{mode.toUpperCase()}</h1>
                    <div className="text-sm space-y-1">
                        <p><span className="font-semibold">Quotation No:</span> {q.quotationNumber}</p>
                        <p><span className="font-semibold">Date:</span> {formatDate(q.date)}</p>
                        <p><span className="font-semibold">Valid Until:</span> {formatDate(q.validUntil)}</p>
                    </div>
                </div>
                 {companyInfo.logo && (
                    <div className="relative w-32 h-32">
                        <Image src={companyInfo.logo} alt="Company Logo" layout="fill" objectFit="contain" />
                    </div>
                )}
            </header>

            {/* Row 2: Company and Client Details */}
            <section className="grid grid-cols-2 gap-8 mb-8 text-sm">
                <div className="space-y-1">
                    <h3 className="font-bold text-gray-800 mb-2 border-b pb-1">From:</h3>
                    <p className="font-semibold text-base">{companyInfo.name || 'Your Company'}</p>
                    <p className="text-gray-600 max-w-xs">{companyInfo.address}</p>
                    {companyInfo.gstin && <p className="text-gray-600">GSTIN: {companyInfo.gstin}</p>}
                    <p className="text-gray-600">Phone: {companyInfo.contact}</p>
                    <p className="text-gray-600">Email: {companyInfo.email}</p>
                    {companyInfo.website && <p className="text-gray-600">Website: {companyInfo.website}</p>}
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-gray-800 mb-2 border-b pb-1">To:</h3>
                    <p className="font-semibold text-base">{q.clientName || 'Client Name'}</p>
                    {q.clientContactPerson && <p>Attn: {q.clientContactPerson}</p>}
                    <p className="text-gray-600">{q.clientAddress}</p>
                    <p className="text-gray-600">Phone: {q.clientPhone}</p>
                    <p className="text-gray-600">Email: {q.clientEmail}</p>
                </div>
            </section>
            
            {/* Row 3: Project Description */}
            {q.projectDescription && (
                 <section className="mb-8">
                    <h3 className="font-bold text-lg mb-2 border-b pb-1 text-primary">Project Description / Purpose</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{q.projectDescription}</p>
                </section>
            )}

            {/* Row 4: Cost Estimate Table */}
            <section className="mb-8">
                <h3 className="font-bold text-lg mb-2 border-b pb-1 text-primary">Cost Estimate</h3>
                <Table>
                    <TableHeader className="bg-gray-100"><TableRow><TableHead className="w-[5%]">Sl.No</TableHead><TableHead className="w-1/2">Description</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {q.items.map((item, index) => (
                        <TableRow key={item.id}><TableCell>{index + 1}</TableCell><TableCell>{item.description || 'Item description'}</TableCell><TableCell className="text-center">{item.quantity}</TableCell><TableCell className="text-right">{item.price.toFixed(2)}</TableCell><TableCell className="text-right font-medium">{(item.quantity * item.price).toFixed(2)}</TableCell></TableRow>
                    ))}
                    </TableBody>
                </Table>
                <div className="flex justify-end mt-4">
                  <div className="w-full max-w-sm space-y-2 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
                    {q.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>- {q.discount.toFixed(2)}</span></div>}
                    <div className="flex justify-between"><span>Discounted Subtotal</span><span>{discountedSubtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>GST ({q.gstPercentage}%)</span><span>+ {gstAmount.toFixed(2)}</span></div>
                    <Separator className="bg-gray-400 my-2"/>
                    <div className="flex justify-between text-xl font-bold text-primary"><span>Total Payable</span><span>{grandTotal.toFixed(2)}</span></div>
                  </div>
                </div>
            </section>
            
            {/* Row 5: Payment Details */}
            <section className="mb-8">
                 <h3 className="font-bold text-lg mb-2 border-b pb-1 text-primary">Payment Details</h3>
                 <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-semibold">Payment Mode:</span> Bank Transfer / UPI / Cash</p>
                    {companyInfo.upiId && <p><span className="font-semibold">UPI ID:</span> {companyInfo.upiId}</p>}
                 </div>
            </section>
        </>
    );
  };
  
  const renderInvoiceDetails = (i: Invoice) => {
    const subtotal = i.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const grandTotal = subtotal - (i.discount || 0);
    
    return (
        <>
           <header className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-bold text-primary mb-4">{mode.toUpperCase()}</h1>
                    <div className="text-sm space-y-1">
                        <p><span className="font-semibold">{mode} No:</span> {i.invoiceNumber}</p>
                        <p><span className="font-semibold">Date:</span> {formatDate(i.date)}</p>
                    </div>
                </div>
                 {companyInfo.logo && (
                    <div className="relative w-32 h-32">
                        <Image src={companyInfo.logo} alt="Company Logo" layout="fill" objectFit="contain" />
                    </div>
                )}
            </header>

            <section className="grid grid-cols-2 gap-8 mb-8 text-sm">
                <div className="space-y-1">
                    <h3 className="font-bold text-gray-800 mb-2 border-b pb-1">From:</h3>
                    <p className="font-semibold text-base">{companyInfo.name || 'Your Company'}</p>
                    <p className="text-gray-600 max-w-xs">{companyInfo.address}</p>
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-gray-800 mb-2 border-b pb-1">To:</h3>
                    <p className="font-semibold text-base">{i.customerName || 'Customer Name'}</p>
                    <p className="text-gray-600">Contact: {i.customerContact}</p>
                </div>
            </section>
            
            <section className="mb-8">
                <Table>
                    <TableHeader className="bg-gray-100"><TableRow><TableHead className="w-[5%]">Sl.No</TableHead><TableHead className="w-1/2">Description</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {i.items.map((item, index) => (
                        <TableRow key={item.id}><TableCell>{index + 1}</TableCell><TableCell>{item.description || 'Item description'}</TableCell><TableCell className="text-center">{item.quantity}</TableCell><TableCell className="text-right">{item.price.toFixed(2)}</TableCell><TableCell className="text-right font-medium">{(item.quantity * item.price).toFixed(2)}</TableCell></TableRow>
                    ))}
                    </TableBody>
                </Table>
                 <div className="flex justify-end mt-4">
                    <div className="w-full max-w-sm space-y-2 text-sm">
                        <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
                        {i.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>- {i.discount.toFixed(2)}</span></div>}
                        <Separator className="bg-gray-400 my-2"/>
                        <div className="flex justify-between text-xl font-bold text-primary"><span>Total</span><span>{grandTotal.toFixed(2)}</span></div>
                    </div>
                </div>
            </section>

             <section className="mb-8">
                 <h3 className="font-bold text-lg mb-2 border-b pb-1 text-primary">Payment Details</h3>
                 <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-semibold">Payment Mode:</span> {i.paymentMode}</p>
                    {i.paymentMode === 'UPI' && i.upiId && <p><span className="font-semibold">Transaction ID:</span> {i.upiId}</p>}
                 </div>
            </section>
            
             <footer className="mt-auto pt-12">
                <div className="flex justify-between items-end">
                    <div className="text-sm max-w-md">
                        <p className="font-semibold">{i.bottomMessage}</p>
                        {/* <p className="text-xs text-gray-500 mt-2">Remember, {companyInfo.authorizedSignatory?.name || 'Amal A M'}</p> */}
                    </div>
                     <div className="text-center">
                        <div className="w-40 h-16 mb-2 flex items-center justify-center">
                        {companyInfo.signature ? (
                            <div className="relative w-full h-full">
                            <Image src={companyInfo.signature} alt="Signature" layout="fill" objectFit="contain" />
                            </div>
                        ) : (
                            <div className="w-full h-full border-b-2 border-dotted"></div>
                        )}
                        </div>
                        <p className="text-sm font-bold">({companyInfo.authorizedSignatory?.name || 'Authorized Signatory'})</p>
                        <p className="text-xs text-gray-600">{companyInfo.authorizedSignatory?.designation}</p>
                        {/* <p className="text-xs text-gray-600 font-semibold">{companyInfo.name}</p> */}
                    </div>
                </div>
            </footer>
        </>
    );
  };
  
  const quotation = isQuotation(invoice, mode) ? invoice : null;


  return (
    <Card id={id} className="w-full mx-auto shadow-lg print:shadow-none">
      <CardContent className="p-8 md:p-12 bg-white text-black flex flex-col aspect-auto">
        
        {isQuotation(invoice, mode) ? renderQuotationDetails(invoice) : renderInvoiceDetails(invoice as Invoice)}

        {quotation && (
            <footer className="mt-auto pt-8 border-t text-sm">
                <div className="flex justify-between items-end mb-8">
                    <div className="text-sm max-w-md">
                        <p className="font-semibold">{quotation.closingNote}</p>
                    </div>
                     <div className="text-center">
                        <div className="w-40 h-16 mb-2 flex items-center justify-center">
                        {companyInfo.signature ? (
                            <div className="relative w-full h-full">
                            <Image src={companyInfo.signature} alt="Signature" layout="fill" objectFit="contain" />
                            </div>
                        ) : (
                            <div className="w-full h-full border-b-2 border-dotted"></div>
                        )}
                        </div>
                        <p className="text-sm font-bold">({companyInfo.authorizedSignatory?.name || 'Authorized Signatory'})</p>
                        <p className="text-xs text-gray-600">{companyInfo.authorizedSignatory?.designation}</p>
                        {/* <p className="text-xs text-gray-600 font-semibold">{companyInfo.name}</p> */}
                    </div>
                </div>
                {quotation.termsAndConditions && (
                    <div className="text-xs text-gray-500">
                      <h3 className="font-bold text-sm mb-2 text-primary">Terms & Conditions</h3>
                      <p className="whitespace-pre-wrap">{quotation.termsAndConditions}</p>
                    </div>
                )}
            </footer>
        )}
      </CardContent>
    </Card>
  );
}
