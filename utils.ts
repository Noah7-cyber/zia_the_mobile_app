import { InvoiceData } from './types';

export const generateInvoiceHTML = (data: InvoiceData) => {
  const subtotal = data.items.reduce((acc, item) => {
    let itemTotal = item.price * item.quantity;
    if (item.discountType === 'percentage') {
      itemTotal *= (100 - (item.discount || 0)) / 100;
    } else {
      itemTotal -= (item.discount || 0);
    }
    return acc + Math.max(0, itemTotal);
  }, 0);

  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .brand { font-size: 24px; font-weight: bold; color: ${data.themeColor}; }
          .invoice-title { font-size: 32px; font-weight: 900; text-transform: uppercase; color: #333; text-align: right; }
          .meta { text-align: right; color: #666; margin-top: 10px; }
          .grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .box { width: 45%; }
          .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 5px; }
          .value { font-size: 14px; line-height: 1.4; white-space: pre-wrap; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #eee; font-size: 10px; text-transform: uppercase; color: #999; }
          td { padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 14px; }
          .text-right { text-align: right; }
          .totals { width: 100%; display: flex; justify-content: flex-end; }
          .totals-box { width: 250px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 15px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">${data.senderName}</div>
            <div class="value" style="margin-top: 10px;">${data.senderDetails}</div>
          </div>
          <div>
            <div class="invoice-title">Invoice</div>
            <div class="meta">#${data.invoiceNumber}</div>
            <div class="meta">Date: ${data.date}</div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="label">Bill To</div>
            <div class="value">${data.clientName}</div>
            <div class="value">${data.clientDetails}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%">Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${data.currency} ${item.price.toFixed(2)}</td>
                <td class="text-right">${data.currency} ${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-box">
            <div class="row">
              <span>Subtotal</span>
              <span>${data.currency} ${subtotal.toFixed(2)}</span>
            </div>
            <div class="row">
              <span>Tax (${data.taxRate}%)</span>
              <span>${data.currency} ${taxAmount.toFixed(2)}</span>
            </div>
            <div class="row total-row" style="color: ${data.themeColor}">
              <span>Total</span>
              <span>${data.currency} ${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};