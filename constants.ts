
import type { InvoiceData, ThemeOption } from './types';

export const THEMES: ThemeOption[] = [
  { name: 'Midnight', hex: '#1e293b', textColor: '#ffffff' },
  { name: 'Emerald', hex: '#059669', textColor: '#ffffff' },
  { name: 'Royal Blue', hex: '#2563eb', textColor: '#ffffff' },
  { name: 'Burgundy', hex: '#9f1239', textColor: '#ffffff' },
  { name: 'Charcoal', hex: '#374151', textColor: '#ffffff' },
  { name: 'Gold', hex: '#ca8a04', textColor: '#ffffff' },
  { name: 'Violet', hex: '#7c3aed', textColor: '#ffffff' },
];

export const DEFAULT_INVOICE: InvoiceData = {
  invoiceNumber: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  senderName: "Zia's Royalle",
  senderDetails: '123 Fashion Ave\nNew York, NY 10001\ncontact@ziaroyale.com',
  clientName: '',
  clientDetails: '',
  items: [
    { id: '1', description: '', quantity: 1, price: 0, discount: 0, discountType: 'fixed' },
  ],
  notes: 'Thank you for your business.',
  terms: '1. Payment is due within 7 days of invoice date.\n2. Alterations are subject to a separate fitting fee.\n3. Custom garments are non-refundable after fabric is cut.',
  currency: '₦',
  taxRate: 0,
  amountPaid: 0,
  themeColor: '#1e293b',
  logo: '',
  signature: '',
};
