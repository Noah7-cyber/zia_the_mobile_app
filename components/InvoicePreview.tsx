import React from 'react';
import { StyleSheet, View, Text, Image, ScrollView } from 'react-native';
import type { InvoiceData } from '../types';

interface Props {
  data: InvoiceData;
}

export const InvoicePreview: React.FC<Props> = ({ data }) => {
  // Logic remains identical to your web version
  const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const totalDiscount = data.items.reduce((acc, item) => {
    if (item.discountType === 'percentage') {
      return acc + (item.price * item.quantity * (item.discount / 100));
    }
    return acc + (item.discount || 0);
  }, 0);

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxAmount = taxableAmount * (data.taxRate / 100);
  const grandTotal = taxableAmount + taxAmount;
  const balanceDue = Math.max(0, grandTotal - (data.amountPaid || 0));

  const hasDiscounts = data.items.some(item => (item.discount || 0) > 0);

  // Status Badge Logic
  let status = "Unpaid";
  let statusColor = "#fef2f2"; // red-50
  let statusTextColor = "#ef4444"; // red-600
  
  if (data.amountPaid > 0) {
    if (balanceDue <= 0) {
      status = "Paid in Full";
      statusColor = "#ecfdf5"; // emerald-50
      statusTextColor = "#10b981"; // emerald-600
    } else {
      status = "Deposit Received";
      statusColor = "#fffbeb"; // amber-50
      statusTextColor = "#d97706"; // amber-600
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Top Accent Bar */}
        <View style={[styles.accentBar, { backgroundColor: data.themeColor }]} />

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.logo ? (
              <Image source={{ uri: data.logo }} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: data.themeColor }]}>
                <Text style={styles.logoText}>{data.senderName.charAt(0) || 'Z'}</Text>
              </View>
            )}
            <Text style={[styles.invoiceTitle, { color: data.themeColor }]}>INVOICE</Text>
            <View style={styles.statusRow}>
              <Text style={styles.invoiceNumber}>#{data.invoiceNumber}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor }]}>
                <Text style={[styles.badgeText, { color: statusTextColor }]}>{status}</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.senderName}>{data.senderName}</Text>
            <Text style={styles.senderDetails}>{data.senderDetails}</Text>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.billingSection}>
          <View style={styles.billTo}>
            <Text style={styles.label}>BILL TO</Text>
            <Text style={styles.clientName}>{data.clientName || 'Valued Client'}</Text>
            <Text style={styles.clientDetails}>{data.clientDetails || "No address provided"}</Text>
          </View>
          <View style={styles.dateSection}>
            <Text style={styles.label}>DATE ISSUED</Text>
            <Text style={styles.dateValue}>{data.date}</Text>
          </View>
        </View>

        {/* Items Table Placeholder */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableLabel, { flex: 2 }]}>DESCRIPTION</Text>
          <Text style={[styles.tableLabel, { flex: 1, textAlign: 'center' }]}>QTY</Text>
          <Text style={[styles.tableLabel, { flex: 1.5, textAlign: 'right' }]}>TOTAL</Text>
        </View>

        {data.items.map((item) => {
          const itemTotal = item.price * item.quantity;
          const disc = item.discountType === 'percentage' 
            ? itemTotal * (item.discount / 100) 
            : (item.discount || 0);
          const finalTotal = Math.max(0, itemTotal - disc);

          return (
            <View key={item.id} style={styles.tableRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemPriceSub}>{data.currency}{item.price.toLocaleString()} each</Text>
              </View>
              <Text style={[styles.itemQty, { flex: 1 }]}>{item.quantity}</Text>
              <Text style={[styles.itemTotal, { flex: 1.5 }]}>{data.currency}{finalTotal.toLocaleString()}</Text>
            </View>
          );
        })}

        {/* Totals Section */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{data.currency}{subtotal.toLocaleString()}</Text>
          </View>
          {totalDiscount > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.discountLabel}>Savings</Text>
              <Text style={styles.discountValue}>-{data.currency}{totalDiscount.toLocaleString()}</Text>
            </View>
          )}
          <View style={[styles.totalLine, styles.grandTotalLine]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{data.currency}{grandTotal.toLocaleString()}</Text>
          </View>

          {/* Balance Due Box */}
          <View style={styles.balanceBox}>
            <View style={styles.balanceRow}>
              <Text style={styles.receivedLabel}>Payment Received</Text>
              <Text style={styles.receivedValue}>{data.currency}{(data.amountPaid || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.balanceRowMain}>
              <Text style={styles.dueLabel}>Balance Due</Text>
              <Text style={[styles.dueValue, { color: data.themeColor }]}>{data.currency}{balanceDue.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        {data.signature && (
          <View style={styles.signatureContainer}>
            <Image source={{ uri: data.signature }} style={styles.signatureImage} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureSub}>Authorized Signature</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  card: {
    backgroundColor: 'white',
    margin: 12,
    borderRadius: 8,
    padding: 20,
    minHeight: 800,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  accentBar: { height: 6, position: 'absolute', top: 0, left: 0, right: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 30 },
  headerLeft: { flex: 1.5 },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  logo: { width: 80, height: 60, marginBottom: 10 },
  logoPlaceholder: { width: 50, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  logoText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  invoiceTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  invoiceNumber: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold' },
  badge: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  senderName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  senderDetails: { fontSize: 11, color: '#64748b', textAlign: 'right', marginTop: 4 },
  billingSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  billTo: { flex: 1.5 },
  dateSection: { flex: 1, alignItems: 'flex-end' },
  label: { fontSize: 10, fontWeight: '900', color: '#cbd5e1', marginBottom: 4 },
  clientName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  clientDetails: { fontSize: 12, color: '#64748b', marginTop: 2 },
  dateValue: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#f1f5f9', paddingBottom: 8, marginBottom: 10 },
  tableLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  itemDescription: { fontSize: 13, fontWeight: '700', color: '#334155' },
  itemPriceSub: { fontSize: 10, color: '#94a3b8' },
  itemQty: { textAlign: 'center', fontSize: 13, color: '#64748b' },
  itemTotal: { textAlign: 'right', fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  totalsContainer: { marginTop: 30, alignItems: 'flex-end' },
  totalLine: { flexDirection: 'row', width: '60%', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 12, color: '#94a3b8' },
  totalValue: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  discountLabel: { fontSize: 12, color: '#ef4444' },
  discountValue: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },
  grandTotalLine: { borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 8, paddingTop: 8 },
  grandTotalLabel: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  grandTotalValue: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  balanceBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, width: '100%', marginTop: 20 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  receivedLabel: { fontSize: 10, fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase' },
  receivedValue: { fontSize: 11, fontWeight: 'bold', color: '#10b981' },
  balanceRowMain: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 },
  dueLabel: { fontSize: 12, fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' },
  dueValue: { fontSize: 18, fontWeight: '900' },
  signatureContainer: { marginTop: 40, alignItems: 'flex-end' },
  signatureImage: { width: 120, height: 60 },
  signatureLine: { borderTopWidth: 1, borderTopColor: '#cbd5e1', width: 150, marginTop: 5 },
  signatureSub: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold', marginTop: 4 }
});