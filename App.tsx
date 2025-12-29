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
  const total = data.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
  
  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 50px; border-bottom: 2px solid ${data.themeColor || '#eee'}; padding-bottom: 20px; }
          .logo { max-width: 120px; max-height: 120px; object-fit: contain; }
          .title { font-size: 32px; font-weight: bold; color: ${data.themeColor || '#333'}; margin-bottom: 5px; }
          .subtitle { color: #666; font-size: 14px; }
          .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .info-col { flex: 1; }
          .info-label { font-size: 10px; text-transform: uppercase; color: #999; font-weight: bold; margin-bottom: 5px; }
          .info-val { font-size: 14px; font-weight: 500; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; border-bottom: 2px solid #eee; padding: 12px 8px; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
          td { border-bottom: 1px solid #f5f5f5; padding: 12px 8px; font-size: 14px; }
          .total-section { display: flex; justify-content: flex-end; margin-top: 20px; }
          .total-box { text-align: right; min-width: 200px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .grand-total { font-size: 20px; font-weight: bold; color: ${data.themeColor || '#333'}; border-top: 2px solid #eee; padding-top: 10px; margin-top: 5px; }
          .signature { margin-top: 60px; text-align: right; }
          .sig-img { max-width: 150px; height: auto; }
          .sig-line { border-top: 1px solid #ccc; width: 200px; display: inline-block; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">INVOICE</div>
            <div class="subtitle">#${data.invoiceNumber || 'DRAFT'}</div>
          </div>
          ${data.logo ? `<img src="${data.logo}" class="logo" />` : ''}
        </div>
        
        <div class="info-grid">
          <div class="info-col">
            <div class="info-label">Date</div>
            <div class="info-val">${data.date || new Date().toLocaleDateString()}</div>
          </div>
          <div class="info-col" style="text-align: right;">
            <div class="info-label">Amount Due</div>
            <div class="info-val" style="font-size: 18px; font-weight: bold;">${data.currency || '₦'}${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%">Description</th>
              <th style="text-align: center">Qty</th>
              <th style="text-align: right">Price</th>
              <th style="text-align: right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align: center">${item.quantity}</td>
                <td style="text-align: right">${data.currency || '₦'}${item.price}</td>
                <td style="text-align: right">${data.currency || '₦'}${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-box">
            <div class="total-row grand-total">
              <span>Total</span>
              <span>${data.currency || '₦'}${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            ${data.amountPaid ? `
            <div class="total-row" style="color: #10b981; font-weight: bold; margin-top: 8px;">
              <span>Paid</span>
              <span>-${data.currency || '₦'}${data.amountPaid.toLocaleString()}</span>
            </div>
            <div class="total-row" style="color: #64748b; font-size: 12px;">
              <span>Balance</span>
              <span>${data.currency || '₦'}${Math.max(0, total - data.amountPaid).toLocaleString()}</span>
            </div>
            ` : ''}
          </div>
        </div>

        ${data.signature ? `
          <div class="signature">
            <img src="${data.signature}" class="sig-img" /><br>
            <div class="sig-line"></div><br>
            <small style="color: #999;">Authorized Signature</small>
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
  const [isLoading, setIsLoading] = useState(true);

  // Load Data on Start (Replacing synchronous localStorage)
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const [savedData, savedHistory, savedInventory] = await Promise.all([
          AsyncStorage.getItem('invoiceData'),
          AsyncStorage.getItem('invoiceHistory'),
          AsyncStorage.getItem('inventory'),
        ]);

        if (savedData) setInvoiceData(JSON.parse(savedData));
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedInventory) setInventory(JSON.parse(savedInventory));
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
      setInvoiceData({
        ...DEFAULT_INVOICE,
        invoiceNumber: nextNumber,
        senderName: invoiceData.senderName,
        senderDetails: invoiceData.senderDetails,
        currency: invoiceData.currency,
        themeColor: invoiceData.themeColor,
        logo: invoiceData.logo,
        signature: invoiceData.signature,
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

    const taxAmount = subtotal * (invoiceData.taxRate / 100);
    const total = subtotal + taxAmount;

    const record: SavedInvoice = {
      ...invoiceData,
      savedAt: new Date().toISOString(),
      totalAmount: total
    };

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
});