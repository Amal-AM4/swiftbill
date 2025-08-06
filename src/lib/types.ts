
export interface Item {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

export interface Quotation {
  quotationNumber: string;
  date: string;
  validUntil: string;
  clientName: string;
  clientContactPerson: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  projectDescription: string;
  items: Item[];
  discount: number;
  gstPercentage: number;
  termsAndConditions: string;
  closingNote: string;
}

export interface CompanyInfo {
  name: string;
  logo?: string; // Data URL of the logo image
  gstin?: string;
  address?: string;
  contact?: string; // Phone
  email?: string;
  website?: string;
  upiId?: string;
  authorizedSignatory: {
    name: string;
    designation: string;
  };
  signature?: string; // Data URL of the signature image
}

export interface Invoice {
  mode: 'Invoice' | 'Receipt' | 'Bill';
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerContact: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
  upiId: string; // Also used for transaction ID
  items: Item[];
  discount: number;
  bottomMessage: string;
}

    