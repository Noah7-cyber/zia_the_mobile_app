
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  discount: number; // Value of discount
  discountType: 'percentage' | 'fixed';
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  senderName: string;
  senderDetails: string;
  clientName: string;
  clientDetails: string;
  items: LineItem[];
  notes: string;
  terms: string;
  currency: string;
  taxRate: number;
  amountPaid: number; // New field for partial payments
  themeColor: string;
  logo: string;
  signature: string;
}

export interface SavedInvoice extends InvoiceData {
  savedAt: string;
  totalAmount: number;
}

export interface ThemeOption {
  name: string;
  hex: string;
  textColor: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  category?: string;
}
