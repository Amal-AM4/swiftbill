
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Quotation, CompanyInfo, Invoice } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InvoicePreview from '@/components/invoice-preview';
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';
import { downloadPdf } from '@/lib/pdf-generator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCompanyInfo, getSavedRecords } from '@/lib/storage';

type RecordType = (Quotation | Invoice) & { type: string; invoiceNumber?: string; quotationNumber?: string; customerName?: string; clientName?: string };
type SortableKeys = 'type' | 'number' | 'name' | 'date' | 'amount';

const initialCompanyInfo: CompanyInfo = { name: '', gstin: '', upiId: '', contact: '', signature: '', address: '', email: '', website: '', logo: '', authorizedSignatory: { name: 'Amal A M', designation: ''} };
const ITEMS_PER_PAGE = 25;


export default function RecordsPage() {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterMode, setFilterMode] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
  
  const [previewRecord, setPreviewRecord] = useState<RecordType | null>(null);
  
  const { toast } = useToast();
  
  const [currentPage, setCurrentPage] = useState(1);
  
  const handleDownload = (e: React.MouseEvent, record: RecordType) => {
    e.stopPropagation(); 
    downloadPdf(record.type as any, record as Quotation | Invoice, companyInfo);
  };
  

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const recordsData = await getSavedRecords();
        setRecords(recordsData);

        const companyInfoData = await getCompanyInfo();
        if (companyInfoData) {
          setCompanyInfo(companyInfoData);
        }

      } catch (error) {
        console.error("Failed to load data from API", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load saved data.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [toast]);


  const calculateGrandTotal = (record: RecordType) => {
     if (record.type === 'Quotation') {
        const q = record as Quotation;
        const subtotal = q.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
        const discountedSubtotal = subtotal - q.discount;
        const gstAmount = discountedSubtotal * (q.gstPercentage / 100);
        return discountedSubtotal + gstAmount;
     } else {
        const i = record as Invoice;
        const subtotal = i.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
        return subtotal - i.discount;
     }
  };
  
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records;

    if (filterMode !== 'All') {
        filtered = filtered.filter(rec => rec.type === filterMode);
    }

    if (startDate) {
        filtered = filtered.filter(rec => new Date(rec.date) >= new Date(startDate));
    }
    if (endDate) {
        filtered = filtered.filter(rec => new Date(rec.date) <= new Date(endDate));
    }

    if (searchQuery) {
      filtered = filtered.filter(rec => {
        const number = 'quotationNumber' in rec ? rec.quotationNumber : rec.invoiceNumber;
        const name = 'clientName' in rec ? rec.clientName : rec.customerName;
        const phone = 'clientPhone' in rec ? rec.clientPhone : rec.customerContact;
        const email = 'clientEmail' in rec ? rec.clientEmail : '';

        return number!.toLowerCase().includes(searchQuery.toLowerCase()) ||
               name!.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (phone && phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
               (email && email.toLowerCase().includes(searchQuery.toLowerCase()));
      });
    }
    
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch(sortConfig.key) {
            case 'type':
                aValue = a.type;
                bValue = b.type;
                break;
            case 'number':
                aValue = a.quotationNumber || a.invoiceNumber || '';
                bValue = b.quotationNumber || b.invoiceNumber || '';
                break;
            case 'name':
                aValue = a.clientName || a.customerName || '';
                bValue = b.clientName || b.customerName || '';
                break;
            case 'date':
                return sortConfig.direction === 'asc' 
                    ? new Date(a.date).getTime() - new Date(b.date).getTime() 
                    : new Date(b.date).getTime() - new Date(a.date).getTime();
            case 'amount':
                 return sortConfig.direction === 'asc' 
                    ? calculateGrandTotal(a) - calculateGrandTotal(b)
                    : calculateGrandTotal(b) - calculateGrandTotal(a);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [records, searchQuery, startDate, endDate, filterMode, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedRecords.length / ITEMS_PER_PAGE);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedRecords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate, filterMode]);


  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateString;
    }
  };
  
  const requestSort = (key: SortableKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />;
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading records...</p>
      </div>
    );
  }

  return (
    <>
      <main>
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-primary font-headline">Saved Records</h1>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to App
              </Link>
            </Button>
          </div>
        </header>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <Card>
            <CardHeader>
              <CardTitle>All Records</CardTitle>
               <div className="mt-4 flex flex-col gap-4">
                  <Input 
                    placeholder="Search by Number, Client/Customer Name, or Contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                          <Label htmlFor="filterMode" className="sr-only">Filter by Type</Label>
                          <Select value={filterMode} onValueChange={setFilterMode}>
                              <SelectTrigger id="filterMode"><SelectValue placeholder="Filter by Type" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="All">All Types</SelectItem>
                                  <SelectItem value="Quotation">Quotation</SelectItem>
                                  <SelectItem value="Invoice">Invoice</SelectItem>
                                  <SelectItem value="Receipt">Receipt</SelectItem>
                                  <SelectItem value="Bill">Bill</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                          <Label htmlFor="startDate" className="whitespace-nowrap">From:</Label>
                          <Input 
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          />
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                          <Label htmlFor="endDate" className="whitespace-nowrap">To:</Label>
                          <Input 
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          />
                      </div>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
              {paginatedRecords.length > 0 ? (
                <>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer" onClick={() => requestSort('type')}>Type {getSortIndicator('type')}</TableHead>
                          <TableHead className="cursor-pointer" onClick={() => requestSort('number')}>Number {getSortIndicator('number')}</TableHead>
                          <TableHead className="cursor-pointer" onClick={() => requestSort('name')}>Client/Customer {getSortIndicator('name')}</TableHead>
                          <TableHead className="cursor-pointer" onClick={() => requestSort('date')}>Date {getSortIndicator('date')}</TableHead>
                          <TableHead className="text-right cursor-pointer" onClick={() => requestSort('amount')}>Amount {getSortIndicator('amount')}</TableHead>
                          <TableHead className="text-center w-[100px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedRecords.map((record, idx) => (
                          <TableRow 
                            key={(record.quotationNumber || record.invoiceNumber) + idx}
                            onClick={() => setPreviewRecord(record)}
                            className="cursor-pointer"
                          >
                            <TableCell>{record.type}</TableCell>
                            <TableCell className="font-medium">{record.quotationNumber || record.invoiceNumber}</TableCell>
                            <TableCell>{record.clientName || record.customerName}</TableCell>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell className="text-right">
                              {calculateGrandTotal(record).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => handleDownload(e, record)}
                                  aria-label={`Download ${record.type}`}
                                >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-4">
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <span>Page {currentPage} of {totalPages}</span>
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">No saved records found for the selected criteria.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Dialog open={!!previewRecord} onOpenChange={(open) => !open && setPreviewRecord(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewRecord?.type} Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-auto">
            {previewRecord && (
              <InvoicePreview 
                id="records-invoice-preview"
                mode={previewRecord.type as any} 
                invoice={previewRecord as Quotation | Invoice} 
                companyInfo={companyInfo}
               />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
