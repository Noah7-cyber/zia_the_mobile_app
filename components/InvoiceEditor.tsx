import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  ScrollView, Modal, FlatList, Image, Alert, Platform, KeyboardAvoidingView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { InvoiceData, LineItem, InventoryItem } from '../types';
import { THEMES } from '../constants';
import { 
  TrashIcon, HangerIcon, TagIcon, NeedleIcon, 
  ScissorsIcon, TapeMeasureIcon, BoxIcon, CheckIcon 
} from './Icons';
import { SignaturePad } from './SignaturePad'; 

interface Props {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
  inventory: InventoryItem[];
}

// Helper component to handle numeric inputs (decimals) gracefully on mobile
const NumericInput = ({ value, onChange, style, placeholder, ...props }: any) => {
  const [localValue, setLocalValue] = useState(value?.toString() || '');

  useEffect(() => {
    const parsed = parseFloat(localValue);
    // Sync only if external value is different from what we have (handling 12. vs 12)
    if (parsed !== value && !(isNaN(parsed) && (value === 0 || !value))) {
      setLocalValue(value?.toString() || '');
    }
  }, [value]);

  return (
    <TextInput
      {...props}
      style={style}
      keyboardType="numeric"
      placeholder={placeholder}
      value={localValue}
      onChangeText={(text) => {
        setLocalValue(text);
        const num = parseFloat(text);
        if (!isNaN(num)) onChange(num);
        else if (text === '') onChange(0);
      }}
    />
  );
};

export const InvoiceEditor: React.FC<Props> = ({ data, onChange, inventory }) => {
  const [showInventoryPicker, setShowInventoryPicker] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const updateField = (field: keyof InvoiceData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    const newItems = data.items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange({ ...data, items: newItems });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      updateField('logo', `data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      {/* Inventory Picker Modal */}
      <Modal visible={showInventoryPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Select</Text>
              <TouchableOpacity onPress={() => setShowInventoryPicker(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={inventory}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.inventoryItem}
                  onPress={() => {
                    const newItem: LineItem = {
                      id: Date.now().toString(),
                      description: item.name,
                      quantity: 1,
                      price: item.price,
                      discount: 0,
                      discountType: 'fixed'
                    };
                    onChange({ ...data, items: [...data.items, newItem] });
                    setShowInventoryPicker(false);
                  }}
                >
                  <View>
                    <Text style={styles.invName}>{item.name}</Text>
                    <Text style={styles.invSub}>{(item.stock || 0)} in stock</Text>
                  </View>
                  <Text style={styles.invPrice}>{(data.currency || '₦')}{(item.price || 0).toLocaleString()}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Signature Modal */}
      <Modal visible={showSignatureModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: 'auto', paddingBottom: 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sign Invoice</Text>
              <TouchableOpacity onPress={() => setShowSignatureModal(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <SignaturePad 
              value={data.signature || ''}
              themeColor={data.themeColor || '#4f46e5'}
              onChange={(base64) => {
                  updateField('signature', base64);
                  if (base64) setShowSignatureModal(false);
              }} 
            />
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Basic Info */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <TagIcon size={14} color="#64748b" />
          <Text style={styles.sectionLabel}>Basic Info</Text>
        </View>
        
        <Text style={styles.inputLabel}>Invoice Number</Text>
        <TextInput 
          style={styles.input} 
          value={data.invoiceNumber || ''} 
          onChangeText={(val) => updateField('invoiceNumber', val)} 
        />

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.inputLabel}>Currency</Text>
            <TouchableOpacity style={styles.input} onPress={() => Alert.alert("Select Currency", "", [
                { text: "₦ (NGN)", onPress: () => updateField('currency', '₦') },
                { text: "$ (USD)", onPress: () => updateField('currency', '$') }
            ])}>
              <Text>{data.currency === '₦' ? '₦ (NGN)' : '$ (USD)'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput style={styles.input} value={data.date || ''} onChangeText={(val) => updateField('date', val)} />
          </View>
        </View>
      </View>

      {/* From (Sender) Info */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <TagIcon size={14} color="#64748b" />
          <Text style={styles.sectionLabel}>From (Your Business)</Text>
        </View>
        <TextInput 
          placeholder="Business Name" 
          style={[styles.input, { marginBottom: 10 }]} 
          value={data.senderName || ''} 
          onChangeText={(val) => updateField('senderName', val)} 
        />
        <TextInput 
          placeholder="Address, Phone, Email..." 
          style={[styles.input, { height: 60, textAlignVertical: 'top' }]} 
          multiline 
          value={data.senderDetails || ''} 
          onChangeText={(val) => updateField('senderDetails', val)} 
        />
      </View>

      {/* To (Client) Info */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <TagIcon size={14} color="#64748b" />
          <Text style={styles.sectionLabel}>Bill To (Client)</Text>
        </View>
        <TextInput 
          placeholder="Client Name" 
          style={[styles.input, { marginBottom: 10 }]} 
          value={data.clientName || ''} 
          onChangeText={(val) => updateField('clientName', val)} 
        />
        <TextInput 
          placeholder="Client Address / Details" 
          style={[styles.input, { height: 60, textAlignVertical: 'top' }]} 
          multiline 
          value={data.clientDetails || ''} 
          onChangeText={(val) => updateField('clientDetails', val)} 
        />
      </View>

      {/* Branding */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <HangerIcon size={14} color="#64748b" />
          <Text style={styles.sectionLabel}>Branding</Text>
        </View>
        <Text style={styles.inputLabel}>Theme Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
          {THEMES.map((theme) => (
            <TouchableOpacity
              key={theme.name}
              onPress={() => updateField('themeColor', theme.hex)}
              style={[styles.colorDot, { backgroundColor: theme.hex }, data.themeColor === theme.hex && styles.activeColorDot]}
            />
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Logo</Text>
        {data.logo ? (
          <View style={styles.logoPreviewRow}>
            <Image source={{ uri: data.logo }} style={styles.logoThumb} />
            <TouchableOpacity onPress={() => updateField('logo', '')}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={styles.changeBtn}><Text style={styles.changeText}>Change</Text></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}><Text style={styles.uploadText}>+ UPLOAD LOGO</Text></TouchableOpacity>
        )}
      </View>

      {/* Items */}
      <View style={styles.sectionCard}>
        <View style={styles.headerBetween}>
          <Text style={styles.sectionLabel}>Items</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => setShowInventoryPicker(true)} style={styles.smallBtn}><Text style={styles.smallBtnText}>+ Stock</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => {
                const newItem: LineItem = { id: Date.now().toString(), description: '', quantity: 1, price: 0, discount: 0, discountType: 'fixed' };
                onChange({ ...data, items: [...data.items, newItem] });
              }} style={[styles.smallBtn, { backgroundColor: data.themeColor || '#4f46e5' }]}><Text style={[styles.smallBtnText, { color: 'white' }]}>+ New</Text></TouchableOpacity>
          </View>
        </View>

        {data.items.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemIndex}>Item #{index + 1}</Text>
              <TouchableOpacity onPress={() => onChange({ ...data, items: data.items.filter(i => i.id !== item.id) })}><TrashIcon size={16} color="#ef4444" /></TouchableOpacity>
            </View>
            <TextInput placeholder="Description" style={styles.input} value={item.description || ''} onChangeText={(v) => updateItem(item.id, 'description', v)} />
            <View style={styles.row}>
              <NumericInput placeholder="Qty" style={[styles.input, { flex: 1 }]} value={item.quantity || 0} onChange={(v: number) => updateItem(item.id, 'quantity', v)} />
              <NumericInput placeholder="Price" style={[styles.input, { flex: 2 }]} value={item.price || 0} onChange={(v: number) => updateItem(item.id, 'price', v)} />
            </View>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{data.currency || '₦'}{data.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
      </View>

      {/* Signature Section */}
      <View style={styles.sectionCard}>
         <View style={styles.sectionTitleRow}>
            <NeedleIcon size={14} color="#64748b" />
            <Text style={styles.sectionLabel}>Sign-off</Text>
         </View>
         {data.signature ? (
             <View style={styles.signaturePreviewContainer}>
                <Image source={{ uri: data.signature }} style={styles.signatureImage} resizeMode="contain" />
                <TouchableOpacity onPress={() => setShowSignatureModal(true)} style={styles.reSignBtn}>
                    <Text style={styles.changeText}>Redraw Signature</Text>
                </TouchableOpacity>
             </View>
         ) : (
            <TouchableOpacity style={styles.signaturePlaceholder} onPress={() => setShowSignatureModal(true)}>
                {/* Fixed the Edit3Icon Reference Error here */}
                <NeedleIcon size={20} color="#94a3b8" />
                <Text style={styles.uploadText}>TAP TO SIGN INVOICE</Text>
            </TouchableOpacity>
         )}
      </View>

      {/* Payment Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>Payment Received</Text>
        <NumericInput 
          style={[styles.input, styles.paymentInput]} 
          value={data.amountPaid || 0}
          onChange={(v: number) => updateField('amountPaid', v)}
        />
        <Text style={styles.inputLabel}>Track deposit/part-payments here.</Text>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  sectionCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b' },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  colorScroll: { marginVertical: 10 },
  colorDot: { width: 30, height: 30, borderRadius: 15, marginRight: 10, borderWidth: 2, borderColor: 'transparent' },
  activeColorDot: { borderColor: '#000', transform: [{ scale: 1.1 }] },
  uploadBox: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 12, padding: 20, alignItems: 'center' },
  uploadText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginTop: 8 },
  logoPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  logoThumb: { width: 40, height: 40, borderRadius: 8 },
  removeText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },
  changeBtn: { marginLeft: 'auto' },
  changeText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' },
  headerBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  smallBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  smallBtnText: { fontSize: 10, fontWeight: 'bold' },
  itemCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemIndex: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },
  paymentInput: { fontSize: 20, fontWeight: 'bold', color: '#10b981', marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeText: { color: '#64748b', fontWeight: 'bold' },
  inventoryItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  invName: { fontWeight: 'bold', fontSize: 14 },
  invSub: { fontSize: 11, color: '#94a3b8' },
  invPrice: { fontWeight: '900', color: '#334155' },
  signaturePlaceholder: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  signaturePreviewContainer: { alignItems: 'center' },
  signatureImage: { width: '100%', height: 100, backgroundColor: 'white', borderRadius: 8 },
  reSignBtn: { marginTop: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  totalValue: { fontSize: 20, fontWeight: '900', color: '#0f172a' }
});