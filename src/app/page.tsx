
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import type { Item, CompanyInfo, Quotation, Invoice } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Download, Plus, Settings, Trash2, Library, Receipt, FileText, FileSignature } from "lucide-react";
import InvoicePreview from '@/components/invoice-preview';
import CompanySettings from '@/components/company-settings';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { downloadPdf } from '@/lib/pdf-generator';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCompanyInfo, saveRecord, saveCompanyInfo } from '@/lib/storage';


const initialItem: Item = { id: Date.now(), description: '', quantity: 1, price: 0.01 };
const initialCompanyInfo: CompanyInfo = { name: '', gstin: '', upiId: '', contact: '', signature: '', address: '', email: '', website: '', logo: '', authorizedSignatory: { name: 'Amal A M', designation: ''} };

const generateNumber = (prefix: string): string => {
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${year}-${randomNumber}`;
};

const getDefaultValidUntil = (): string => {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    return date.toISOString().split('T')[0];
};

const initialQuotation: Quotation = {
    quotationNumber: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: getDefaultValidUntil(),
    clientName: '',
    clientContactPerson: '',
    clientAddress: '',
    clientPhone: '',
    clientEmail: '',
    projectDescription: '',
    items: [{ ...initialItem }],
    discount: 0,
    gstPercentage: 18,
    termsAndConditions: '1. 50% advance payment to initiate the project.\n2. Remaining 50% on delivery.\n3. Quotation valid for 15 days.\n4. GST will be applicable as per government norms.',
    closingNote: 'Thank you for considering our services. We look forward to working with you and delivering value to your organization.',
};

const initialInvoice: Invoice = {
    mode: 'Invoice',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerContact: '',
    paymentMode: 'UPI',
    upiId: '',
    items: [{ ...initialItem }],
    discount: 0,
    bottomMessage: 'Thank you for your business!',
};


export default function App() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  const [mode, setMode] = useState<'Quotation' | 'Invoice' | 'Receipt' | 'Bill'>('Quotation');
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [quotation, setQuotation] = useState<Quotation>(initialQuotation);
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // This function fetches company info from the API
  const fetchCompanyInfo = async () => {
    try {
      const info = await getCompanyInfo();
      if (info) {
        setCompanyInfo(info);
        setInvoice(prev => ({ ...prev, upiId: info.upiId || '' }));
      }
    } catch (error) {
      console.error("Failed to fetch company info:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load company settings." });
    }
  };

  // Fetch company info on initial load
  useEffect(() => {
    setIsClient(true);
    fetchCompanyInfo();
  }, []);


  useEffect(() => {
    const prefix = {
        'Quotation': 'QUO',
        'Invoice': 'INV',
        'Receipt': 'REC',
        'Bill': 'BILL'
    }[mode];

    if (mode === 'Quotation') {
        if (!quotation.quotationNumber) {
            setQuotation(prev => ({ ...prev, quotationNumber: generateNumber(prefix)}));
        }
    } else {
        if (!invoice.invoiceNumber || invoice.mode !== mode) {
            setInvoice(prev => ({ ...initialInvoice, mode, upiId: companyInfo.upiId || '', invoiceNumber: generateNumber(prefix) }));
        }
    }
  }, [mode, quotation.quotationNumber, invoice.invoiceNumber, invoice.mode, companyInfo.upiId]);

  const handleQuotationChange = (field: keyof Quotation, value: any) => {
    setQuotation(prev => ({ ...prev, [field]: value }));
  };
  
  const handleInvoiceChange = (field: keyof Invoice, value: any) => {
    setInvoice(prev => ({...prev, [field]: value}));
  };

  const handleItemChange = (id: number, field: keyof Item, value: any) => {
    const updateItems = (items: Item[]) => items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    if (mode === 'Quotation') {
        handleQuotationChange('items', updateItems(quotation.items));
    } else {
        handleInvoiceChange('items', updateItems(invoice.items));
    }
  };

  const addItem = () => {
    const newItem = { ...initialItem, id: Date.now() };
    if (mode === 'Quotation') {
        handleQuotationChange('items', [...quotation.items, newItem]);
    } else {
        handleInvoiceChange('items', [...invoice.items, newItem]);
    }
  };

  const removeItem = (id: number) => {
    const currentItems = mode === 'Quotation' ? quotation.items : invoice.items;
    if (currentItems.length > 1) {
       const updatedItems = currentItems.filter(item => item.id !== id);
       if (mode === 'Quotation') {
            handleQuotationChange('items', updatedItems);
       } else {
            handleInvoiceChange('items', updatedItems);
       }
    }
  };
  
  const { subtotal, gstAmount, grandTotal, invoiceSubtotal, invoiceGrandTotal } = useMemo(() => {
    // Quotation
    const sub = quotation.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const discountedSubtotal = sub - quotation.discount;
    const gst = discountedSubtotal * (quotation.gstPercentage / 100);
    const grand = discountedSubtotal + gst;

    // Invoice/Bill/Receipt
    const invSub = invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const invGrand = invSub - invoice.discount;

    return { subtotal: sub, gstAmount: gst, grandTotal: grand, invoiceSubtotal: invSub, invoiceGrandTotal: invGrand };
  }, [quotation.items, quotation.discount, quotation.gstPercentage, invoice.items, invoice.discount]);


  const validateData = () => {
    if (mode === 'Quotation') {
        if (!quotation.clientName.trim()) return "Please enter a client name.";
        if (quotation.items.some(item => !item.description.trim() || item.price <= 0))
            return "Please ensure all items have a description and a price greater than zero.";
    } else {
        if (!invoice.customerName.trim()) return "Please enter a customer name.";
        if (invoice.items.some(item => !item.description.trim() || item.price <= 0))
            return "Please ensure all items have a description and a price greater than zero.";
    }
    return null;
  };
  
  const handleDownloadClick = () => {
    const validationError = validateData();
    if (validationError) {
      toast({ variant: "destructive", title: "Cannot Download PDF", description: validationError });
      return;
    }
    const data = mode === 'Quotation' ? quotation : invoice;
    downloadPdf(mode, data, companyInfo);
  };

  const handleSaveRecord = async () => {
     const validationError = validateData();
    if (validationError) {
      toast({ variant: "destructive", title: "Cannot Save Record", description: validationError });
      return;
    }
    try {
      const dataToSave = mode === 'Quotation' ? { ...quotation, type: 'Quotation' } : { ...invoice, type: mode };
      await saveRecord(dataToSave as any);
      toast({ title: "Success", description: `${mode} saved successfully.` });
      
      // Generate new number
       const prefix = { 'Quotation': 'QUO', 'Invoice': 'INV', 'Receipt': 'REC', 'Bill': 'BILL' }[mode];
       if (mode === 'Quotation') {
         setQuotation(prev => ({ ...prev, quotationNumber: generateNumber(prefix) }));
       } else {
         setInvoice(prev => ({ ...prev, invoiceNumber: generateNumber(prefix) }));
       }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Could not save ${mode}.`;
      toast({ variant: "destructive", title: "Error", description: errorMessage });
      console.error(`Failed to save ${mode}`, error);
    }
  };

  if (!isClient) {
    return null; // or a loading spinner
  }

  const items = mode === 'Quotation' ? quotation.items : invoice.items;

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-primary font-headline">SwiftBill</h1>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/records">
                  <Library className="h-5 w-5 mr-2" />
                  View Records
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-5 w-5" />
                <span className="sr-only">Company Settings</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            <Tabs value={mode} onValueChange={(value) => setMode(value as any)} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="Quotation"><FileSignature className="mr-2" /> Quotation</TabsTrigger>
                    <TabsTrigger value="Invoice"><FileText className="mr-2" /> Invoice</TabsTrigger>
                    <TabsTrigger value="Receipt"><Receipt className="mr-2" /> Receipt</TabsTrigger>
                    <TabsTrigger value="Bill"><FileText className="mr-2" /> Bill</TabsTrigger>
                </TabsList>
            </Tabs>
        
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                
              {mode === 'Quotation' ? (
                // QUOTATION FORM
                <>
                  <Card>
                    <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                         <div>
                          <Label htmlFor="quotationNumber">Quotation Number</Label>
                          <Input id="quotationNumber" value={quotation.quotationNumber} readOnly />
                        </div>
                         <div>
                          <Label htmlFor="date">Date</Label>
                          <Input id="date" type="date" value={quotation.date} onChange={e => handleQuotationChange('date', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="validUntil">Valid Until</Label>
                        <Input id="validUntil" type="date" value={quotation.validUntil} onChange={e => handleQuotationChange('validUntil', e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Client Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="clientName">Client/Company Name</Label>
                        <Input id="clientName" placeholder="ABC Corp" value={quotation.clientName} onChange={e => handleQuotationChange('clientName', e.target.value)} />
                      </div>
                       <div>
                        <Label htmlFor="clientContactPerson">Attn: Contact Person</Label>
                        <Input id="clientContactPerson" placeholder="John Doe" value={quotation.clientContactPerson} onChange={e => handleQuotationChange('clientContactPerson', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="clientAddress">Address</Label>
                        <Textarea id="clientAddress" placeholder="123 Main St, Anytown" value={quotation.clientAddress} onChange={e => handleQuotationChange('clientAddress', e.target.value)} />
                      </div>
                       <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="clientPhone">Phone</Label>
                            <Input id="clientPhone" placeholder="123-456-7890" value={quotation.clientPhone} onChange={e => handleQuotationChange('clientPhone', e.target.value)} />
                          </div>
                          <div>
                            <Label htmlFor="clientEmail">Email</Label>
                            <Input id="clientEmail" placeholder="john.doe@example.com" value={quotation.clientEmail} onChange={e => handleQuotationChange('clientEmail', e.target.value)} />
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader><CardTitle>Project Description / Purpose</CardTitle></CardHeader>
                    <CardContent>
                      <Textarea id="projectDescription" placeholder="A brief description of the project or purpose of this quotation." value={quotation.projectDescription} onChange={e => handleQuotationChange('projectDescription', e.target.value)} />
                    </CardContent>
                  </Card>
                </>
              ) : (
                // INVOICE / RECEIPT / BILL FORM
                 <Card>
                    <CardHeader><CardTitle>{mode} Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                       <div className="grid sm:grid-cols-2 gap-4">
                           <div>
                                <Label htmlFor="invoiceNumber">{mode} Number</Label>
                                <Input id="invoiceNumber" value={invoice.invoiceNumber} readOnly />
                           </div>
                           <div>
                                <Label htmlFor="invoiceDate">Date</Label>
                                <Input id="invoiceDate" type="date" value={invoice.date} onChange={e => handleInvoiceChange('date', e.target.value)} />
                           </div>
                       </div>
                       <div>
                           <Label htmlFor="customerName">Customer Name</Label>
                           <Input id="customerName" value={invoice.customerName} onChange={e => handleInvoiceChange('customerName', e.target.value)} />
                       </div>
                       <div>
                           <Label htmlFor="customerContact">Customer Contact</Label>
                           <Input id="customerContact" value={invoice.customerContact} onChange={e => handleInvoiceChange('customerContact', e.target.value)} />
                       </div>
                       <div className="grid sm:grid-cols-2 gap-4">
                           <div>
                                <Label htmlFor="paymentMode">Payment Mode</Label>
                                <Select value={invoice.paymentMode} onValueChange={(val) => handleInvoiceChange('paymentMode', val)}>
                                    <SelectTrigger id="paymentMode"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UPI">UPI</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                           </div>
                            {invoice.paymentMode === 'UPI' && (
                               <div>
                                   <Label htmlFor="upiId">UPI ID / Transaction ID</Label>
                                   <Input id="upiId" value={invoice.upiId} onChange={e => handleInvoiceChange('upiId', e.target.value)} />
                               </div>
                            )}
                       </div>
                    </CardContent>
                 </Card>
              )}


              <Card>
                <CardHeader>
                  <CardTitle>Cost Estimate</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2">Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell><Input placeholder="Item or service description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} /></TableCell>
                          <TableCell><Input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} className="w-16" /></TableCell>
                          <TableCell><Input type="number" min="0.01" step="0.01" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} className="w-24" /></TableCell>
                          <TableCell className="font-medium">{(item.quantity * item.price).toFixed(2)}</TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button onClick={addItem} variant="outline" className="mt-4 w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </CardContent>
              </Card>
              
              {mode === 'Quotation' && (
                <Card>
                    <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea id="termsAndConditions" value={quotation.termsAndConditions} onChange={e => handleQuotationChange('termsAndConditions', e.target.value)} className="h-32"/>
                    </CardContent>
                </Card>
              )}


              <Card>
                <CardHeader>
                  <CardTitle>Summary & Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode === 'Quotation' ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
                          <div className="flex justify-between items-center">
                            <Label htmlFor="discount">Discount</Label>
                            <Input id="discount" type="number" value={quotation.discount} onChange={e => handleQuotationChange('discount', parseFloat(e.target.value) || 0)} className="w-24" />
                          </div>
                          <div className="flex justify-between items-center">
                            <Label htmlFor="gstPercentage">GST (%)</Label>
                             <Input id="gstPercentage" type="number" value={quotation.gstPercentage} onChange={e => handleQuotationChange('gstPercentage', parseFloat(e.target.value) || 0)} className="w-24" />
                          </div>
                           <div className="flex justify-between"><span>GST Amount</span><span>{gstAmount.toFixed(2)}</span></div>
                          <div className="flex justify-between font-bold text-lg"><span className="font-headline">Total Payable</span><span>{grandTotal.toFixed(2)}</span></div>
                        </div>
                         <div>
                          <Label htmlFor="closingNote">Closing Note</Label>
                          <Textarea id="closingNote" placeholder="Thank you message..." value={quotation.closingNote} onChange={e => handleQuotationChange('closingNote', e.target.value)} />
                        </div>
                      </>
                  ) : (
                      <>
                        <div className="space-y-2">
                            <div className="flex justify-between"><span>Subtotal</span><span>{invoiceSubtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center">
                                <Label htmlFor="invoiceDiscount">Discount</Label>
                                <Input id="invoiceDiscount" type="number" value={invoice.discount} onChange={e => handleInvoiceChange('discount', parseFloat(e.target.value) || 0)} className="w-24" />
                            </div>
                            <div className="flex justify-between font-bold text-lg"><span className="font-headline">Total Payable</span><span>{invoiceGrandTotal.toFixed(2)}</span></div>
                        </div>
                        <div>
                            <Label htmlFor="bottomMessage">Message</Label>
                            <Textarea id="bottomMessage" value={invoice.bottomMessage} onChange={e => handleInvoiceChange('bottomMessage', e.target.value)} />
                        </div>
                      </>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleDownloadClick} className="w-full sm:w-auto flex-1 bg-accent hover:bg-accent/90">
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                    <Button onClick={handleSaveRecord} className="w-full sm:w-auto flex-1">Save Record</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="hidden lg:block">
               <div className="sticky top-24 self-start">
                  <InvoicePreview 
                    id="invoice-preview" 
                    mode={mode}
                    invoice={mode === 'Quotation' ? quotation : invoice} 
                    companyInfo={companyInfo}
                  />
               </div>
            </div>
          </div>
        </main>
      </div>
      
      <CompanySettings 
        isOpen={isSettingsOpen} 
        setIsOpen={setIsSettingsOpen} 
        companyInfo={companyInfo} 
        onCompanyInfoUpdate={fetchCompanyInfo}
      />
    </>
  );
}
