import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  StatusBar, 
  Alert,
  Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { 
  Edit3 as EditIcon, 
  BarChart2 as ChartIcon, 
  Share2 as ShareIcon, 
  Box as BoxIcon, 
  Eye as EyeIcon, 
  Plus as PlusIcon,
  Save as SaveIcon
} from 'lucide-react-native';

// Standard TS imports remain the same
import type { InvoiceData, SavedInvoice, InventoryItem } from './types';
import { DEFAULT_INVOICE } from './constants';

// Native versions of your components (to be converted next)
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { Analytics } from './components/Analytics';
import { Inventory } from './components/Inventory';

// HTML Generator for PDF (Offline compatible)
const generateInvoiceHTML = (data: InvoiceData) => {
  const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const totalDiscount = data.items.reduce((acc, item) => {
    if (item.discountType === 'percentage') {
      return acc + (item.price * item.quantity * (item.discount / 100));
    }
    return acc + (item.discount || 0);
  }, 0);

  const grandTotal = Math.max(0, subtotal - totalDiscount);
  const balanceDue = Math.max(0, grandTotal - (data.amountPaid || 0));

  let status = "Unpaid";
  let statusColor = "#fef2f2";
  let statusTextColor = "#ef4444";

  if (data.amountPaid > 0) {
    if (balanceDue <= 0) {
      status = "Paid in Full";
      statusColor = "#ecfdf5";
      statusTextColor = "#10b981";
    } else {
      status = "Deposit Received";
      statusColor = "#fffbeb";
      statusTextColor = "#d97706";
    }
  }
  
  return `
    <html>
      <head>
        <style>
          @page { size: A4; margin: 0; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; width: 794px; margin: 0 auto; background-color: white; font-size: 14px; }
          .accent-bar { height: 8px; background-color: ${data.themeColor || '#1e293b'}; width: 100%; border-radius: 4px 4px 0 0; margin-bottom: 30px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 50px; }
          .logo { max-width: 100px; max-height: 80px; object-fit: contain; margin-bottom: 10px; }
          .logo-placeholder { width: 50px; height: 50px; background-color: ${data.themeColor || '#1e293b'}; border-radius: 8px; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .title { font-size: 42px; font-weight: 900; letter-spacing: -1px; color: ${data.themeColor || '#333'}; margin-bottom: 5px; }
          .invoice-meta { display: flex; align-items: center; gap: 10px; }
          .invoice-number { color: #94a3b8; font-weight: bold; font-size: 16px; }
          .status-badge { background-color: ${statusColor}; color: ${statusTextColor}; padding: 6px 10px; border-radius: 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; display: inline-block; }

          .sender-details { text-align: right; font-size: 13px; color: #64748b; line-height: 1.5; }
          .sender-name { font-weight: bold; font-size: 16px; color: #1e293b; margin-bottom: 4px; }

          .billing-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .bill-label { font-size: 12px; font-weight: 900; color: #cbd5e1; margin-bottom: 5px; text-transform: uppercase; }
          .client-name { font-size: 18px; font-weight: bold; color: #1e293b; }
          .client-details { font-size: 14px; color: #64748b; margin-top: 2px; }
          .date-val { font-size: 15px; font-weight: 700; color: #1e293b; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; border-bottom: 2px solid #f1f5f9; padding: 12px 8px; color: #94a3b8; font-size: 12px; font-weight: 900; text-transform: uppercase; }
          td { border-bottom: 1px solid #f8fafc; padding: 12px 8px; font-size: 14px; color: #334155; }
          .td-desc { font-weight: 700; }
          .td-qty { text-align: center; color: #64748b; }
          .td-total { text-align: right; font-weight: bold; color: #1e293b; }

          .total-section { display: flex; flex-direction: column; align-items: flex-end; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; width: 300px; padding: 6px 0; }
          .total-label { font-size: 14px; color: #94a3b8; }
          .total-val { font-size: 14px; font-weight: bold; color: #334155; }
          .discount-row { color: #ef4444; }
          .grand-total { border-top: 2px solid #f1f5f9; margin-top: 12px; padding-top: 12px; }
          .grand-total .total-label { font-size: 16px; font-weight: bold; color: #1e293b; }
          .grand-total .total-val { font-size: 24px; font-weight: 900; color: #1e293b; }

          .balance-box { background-color: #f8fafc; padding: 16px; border-radius: 12px; width: 300px; margin-top: 25px; }
          .balance-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .paid-label { font-size: 12px; font-weight: bold; color: #10b981; text-transform: uppercase; }
          .paid-val { font-size: 13px; font-weight: bold; color: #10b981; }
          .due-row { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 8px; }
          .due-label { font-size: 14px; font-weight: 900; color: #1e293b; text-transform: uppercase; }
          .due-val { font-size: 22px; font-weight: 900; color: ${data.themeColor || '#333'}; }

          .signature { margin-top: 80px; text-align: right; }
          .sig-img { width: 150px; height: 75px; object-fit: contain; }
          .sig-line { border-top: 1px solid #cbd5e1; width: 200px; display: inline-block; margin-top: 10px; }
          .sig-sub { font-size: 11px; color: #94a3b8; font-weight: bold; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="accent-bar"></div>
        <div class="header">
          <div>
            ${data.logo ? `<img src="${data.logo}" class="logo" />` : `
              <div class="logo-placeholder">${data.senderName.charAt(0) || 'Z'}</div>
            `}
            <div class="title">INVOICE</div>
            <div class="invoice-meta">
              <span class="invoice-number">#${data.invoiceNumber || 'DRAFT'}</span>
              <span class="status-badge">${status}</span>
            </div>
          </div>
          <div style="text-align: right;">
             <div class="sender-name">${data.senderName}</div>
             <div class="sender-details">${data.senderDetails.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
        
        <div class="billing-grid">
          <div>
            <div class="bill-label">BILL TO</div>
            <div class="client-name">${data.clientName || 'Valued Client'}</div>
            <div class="client-details">${(data.clientDetails || "No address provided").replace(/\n/g, '<br>')}</div>
          </div>
          <div style="text-align: right;">
            <div class="bill-label">DATE ISSUED</div>
            <div class="date-val">${data.date || new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%">DESCRIPTION</th>
              <th style="text-align: center">QTY</th>
              <th style="text-align: right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => {
              const itemTotal = item.price * item.quantity;
              const disc = item.discountType === 'percentage'
                ? itemTotal * (item.discount / 100)
                : (item.discount || 0);
              const finalTotal = Math.max(0, itemTotal - disc);

              return `
              <tr>
                <td>
                  <div class="td-desc">${item.description}</div>
                  <div style="font-size: 10px; color: #94a3b8;">${data.currency}${item.price.toLocaleString()} each</div>
                </td>
                <td class="td-qty">${item.quantity}</td>
                <td class="td-total">${data.currency}${finalTotal.toLocaleString()}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span class="total-label">Subtotal</span>
            <span class="total-val">${data.currency}${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          ${totalDiscount > 0 ? `
          <div class="total-row discount-row">
            <span class="total-label" style="color: #ef4444;">Savings</span>
            <span class="total-val" style="color: #ef4444;">-${data.currency}${totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          ` : ''}
          <div class="total-row grand-total">
            <span class="total-label">Grand Total</span>
            <span class="total-val">${data.currency}${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>

          <div class="balance-box">
             <div class="balance-row">
               <span class="paid-label">Payment Received</span>
               <span class="paid-val">${data.currency}${(data.amountPaid || 0).toLocaleString()}</span>
             </div>
             <div class="balance-row due-row">
               <span class="due-label">Balance Due</span>
               <span class="due-val">${data.currency}${balanceDue.toLocaleString()}</span>
             </div>
          </div>
        </div>

        ${data.signature ? `
          <div class="signature">
            <img src="${data.signature}" class="sig-img" /><br>
            <div class="sig-line"></div><br>
            <div class="sig-sub">Authorized Signature</div>
          </div>
        ` : ''}
      </body>
    </html>
  `;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'analytics' | 'inventory'>('edit');
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(DEFAULT_INVOICE);
  const [history, setHistory] = useState<SavedInvoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [businessProfile, setBusinessProfile] = useState<Partial<InvoiceData>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load Data on Start (Replacing synchronous localStorage)
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const [savedData, savedHistory, savedInventory, savedProfile] = await Promise.all([
          AsyncStorage.getItem('invoiceData'),
          AsyncStorage.getItem('invoiceHistory'),
          AsyncStorage.getItem('inventory'),
          AsyncStorage.getItem('businessProfile'),
        ]);

        if (savedData) setInvoiceData(JSON.parse(savedData));
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedInventory) setInventory(JSON.parse(savedInventory));
        if (savedProfile) setBusinessProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadPersistedData();
  }, []);

  // Persist Data on Changes
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('invoiceData', JSON.stringify(invoiceData));
    }
  }, [invoiceData, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('invoiceHistory', JSON.stringify(history));
    }
  }, [history, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('inventory', JSON.stringify(inventory));
    }
  }, [inventory, isLoading]);

  const getNextInvoiceNumber = (currentHistory: SavedInvoice[]) => {
    if (currentHistory.length === 0) return 'INV-001';
    const lastNumbers = currentHistory
      .map(h => {
        const match = h.invoiceNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const maxNum = Math.max(0, ...lastNumbers);
    return `INV-${(maxNum + 1).toString().padStart(3, '0')}`;
  };

  const handleNewInvoice = () => {
    const startNew = () => {
      const nextNumber = getNextInvoiceNumber(history);
      const profileToUse = businessProfile.senderName ? businessProfile : invoiceData;

      setInvoiceData({
        ...DEFAULT_INVOICE,
        invoiceNumber: nextNumber,
        senderName: profileToUse.senderName || DEFAULT_INVOICE.senderName,
        senderDetails: profileToUse.senderDetails || DEFAULT_INVOICE.senderDetails,
        currency: profileToUse.currency || DEFAULT_INVOICE.currency,
        themeColor: profileToUse.themeColor || DEFAULT_INVOICE.themeColor,
        logo: profileToUse.logo || DEFAULT_INVOICE.logo,
        signature: profileToUse.signature || DEFAULT_INVOICE.signature,
        date: new Date().toISOString().split('T')[0],
      });
      setActiveTab('edit');
    };

    if (invoiceData.items.length > 0 && invoiceData.clientName) {
      Alert.alert(
        "New Invoice",
        "Discard current draft and start a new invoice?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes", onPress: startNew }
        ]
      );
    } else {
      startNew();
    }
  };

  const handleSaveRecord = () => {
    const subtotal = invoiceData.items.reduce((acc, item) => {
      let itemTotal = item.price * item.quantity;
      if (item.discountType === 'percentage') {
        itemTotal *= (100 - (item.discount || 0)) / 100;
      } else {
        itemTotal -= (item.discount || 0);
      }
      return acc + Math.max(0, itemTotal);
    }, 0);

    const total = subtotal;

    const record: SavedInvoice = {
      ...invoiceData,
      savedAt: new Date().toISOString(),
      totalAmount: total
    };

    // Update Business Profile
    const newProfile = {
       senderName: invoiceData.senderName,
       senderDetails: invoiceData.senderDetails,
       currency: invoiceData.currency,
       themeColor: invoiceData.themeColor,
       logo: invoiceData.logo,
       signature: invoiceData.signature,
    };
    setBusinessProfile(newProfile);
    AsyncStorage.setItem('businessProfile', JSON.stringify(newProfile));

    const existingIndex = history.findIndex(h => h.invoiceNumber === invoiceData.invoiceNumber);
    if (existingIndex > -1) {
      const newHistory = [...history];
      newHistory[existingIndex] = record;
      setHistory(newHistory);
    } else {
      setHistory([record, ...history]);
    }
    return true;
  };

  const handleSaveOnly = () => {
    handleSaveRecord();
    Alert.alert("Success", "Invoice saved to history.");
  };

  const handleSaveAndShare = async () => {
    handleSaveRecord();
    try {
      const html = generateInvoiceHTML(invoiceData); 
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (err) {
      Alert.alert("Error", "Failed to generate PDF");
    }
  };

  const handleEditInvoice = (savedInvoice: SavedInvoice) => {
    const { savedAt, totalAmount, ...editableData } = savedInvoice;
    setInvoiceData(editableData);
    setActiveTab('edit');
  };

  const handleDeleteInvoice = (invoice: SavedInvoice) => {
    Alert.alert(
      "Delete Invoice",
      `Are you sure you want to delete Invoice #${invoice.invoiceNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => setHistory(history.filter(h => h.invoiceNumber !== invoice.invoiceNumber)) 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header Nav */}
      <View style={styles.nav}>
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: invoiceData.themeColor }]}>
            <Text style={styles.logoText}>Z</Text>
          </View>
          <Text style={styles.brandText}>Zia's Royalle</Text>
        </View>

        <View style={styles.headerActions}>
           <TouchableOpacity onPress={handleNewInvoice} style={styles.actionIcon}>
             <PlusIcon size={20} color="#64748b" />
           </TouchableOpacity>
           <TouchableOpacity 
             onPress={handleSaveOnly} 
             style={[styles.shareBtn, { backgroundColor: invoiceData.themeColor }]}
            >
             <SaveIcon size={16} color="white" />
             <Text style={styles.shareBtnText}>Save</Text>
           </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Control / Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('edit')} style={[styles.tab, activeTab === 'edit' && styles.activeTab]}>
            <EditIcon size={18} color={activeTab === 'edit' ? '#0f172a' : '#94a3b8'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('preview')} style={[styles.tab, activeTab === 'preview' && styles.activeTab]}>
            <EyeIcon size={18} color={activeTab === 'preview' ? '#0f172a' : '#94a3b8'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('inventory')} style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}>
            <BoxIcon size={18} color={activeTab === 'inventory' ? '#0f172a' : '#94a3b8'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('analytics')} style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}>
            <ChartIcon size={18} color={activeTab === 'analytics' ? '#0f172a' : '#94a3b8'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {activeTab === 'edit' && (
          <InvoiceEditor data={invoiceData} onChange={setInvoiceData} inventory={inventory} />
        )}
        
        {activeTab === 'preview' && (
          <ScrollView contentContainerStyle={styles.main}>
            <InvoicePreview data={invoiceData} />
            <TouchableOpacity 
              style={[styles.pdfBtn, { backgroundColor: invoiceData.themeColor || '#0f172a' }]} 
              onPress={handleSaveAndShare}
            >
              <ShareIcon size={18} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.pdfBtnText}>Generate & Share PDF</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
        
        {activeTab === 'inventory' && (
          <View style={styles.tabWrapper}>
            <Inventory inventory={inventory} setInventory={setInventory} themeColor={invoiceData.themeColor} />
          </View>
        )}
        
        {activeTab === 'analytics' && (
          <View style={styles.tabWrapper}>
            <Analytics 
              history={history} 
              themeColor={invoiceData.themeColor} 
              onEditInvoice={handleEditInvoice} 
              onDeleteInvoice={handleDeleteInvoice} 
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 45 : 0,
  },
  nav: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  },
  brandText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
    marginRight: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shareBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  tabContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
  },
  tabWrapper: {
    flex: 1,
    padding: 16,
  },
  main: {
    padding: 16,
  },
  pdfBtn: { flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 40 },
  pdfBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});// test change
