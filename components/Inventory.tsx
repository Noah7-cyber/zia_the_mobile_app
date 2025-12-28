import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView 
} from 'react-native';
import type { InventoryItem } from '../types';
import { PlusIcon, TrashIcon, BoxIcon, EditIcon, CheckIcon } from './Icons';

interface Props {
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
  themeColor: string;
}

export const Inventory: React.FC<Props> = ({ inventory, setInventory, themeColor }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setSku('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!name || !price) {
      Alert.alert("Error", "Item name and price are required");
      return;
    }

    const newItem: InventoryItem = {
      id: editingId || Date.now().toString(),
      name,
      description,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      sku
    };

    if (editingId) {
      setInventory(inventory.map(item => item.id === editingId ? newItem : item));
    } else {
      setInventory([...inventory, newItem]);
    }
    resetForm();
  };

  const handleEdit = (item: InventoryItem) => {
    setName(item.name);
    setDescription(item.description || '');
    setPrice(item.price.toString());
    setStock(item.stock.toString());
    setSku(item.sku || '');
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => setInventory(inventory.filter(item => item.id !== id)) 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={[styles.headerCard, { backgroundColor: themeColor }]}>
        <View>
          <View style={styles.headerRow}>
            <BoxIcon color="white" size={24} />
            <Text style={styles.headerTitle}>Inventory</Text>
          </View>
          <Text style={styles.headerSub}>Manage stock and products.</Text>
        </View>
        <TouchableOpacity 
          onPress={() => { resetForm(); setIsAdding(!isAdding); }}
          style={styles.addButton}
        >
          {isAdding ? (
            <Text style={styles.addButtonText}>Cancel</Text>
          ) : (
            <PlusIcon color="white" size={20} />
          )}
        </TouchableOpacity>
      </View>

      {isAdding ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formContainer}
        >
          <ScrollView>
            <Text style={styles.formLabel}>Item Name *</Text>
            <TextInput 
              style={styles.input} 
              value={name} 
              onChangeText={setName} 
              placeholder="e.g. White Silk Fabric" 
            />

            <Text style={styles.formLabel}>SKU / Code</Text>
            <TextInput 
              style={styles.input} 
              value={sku} 
              onChangeText={setSku} 
              placeholder="Optional SKU" 
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.formLabel}>Unit Price (₦)</Text>
                <TextInput 
                  style={styles.input} 
                  value={price} 
                  onChangeText={setPrice} 
                  placeholder="0.00" 
                  keyboardType="numeric" 
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.formLabel}>Stock Quantity</Text>
                <TextInput 
                  style={styles.input} 
                  value={stock} 
                  onChangeText={setStock} 
                  placeholder="0" 
                  keyboardType="numeric" 
                />
              </View>
            </View>

            <Text style={styles.formLabel}>Description</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={description} 
              onChangeText={setDescription} 
              placeholder="Additional details..." 
              multiline 
            />

            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.saveButton, { backgroundColor: themeColor }]}
            >
              <CheckIcon color="white" size={20} />
              <Text style={styles.saveButtonText}>Save to Inventory</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BoxIcon color="#cbd5e1" size={48} />
              <Text style={styles.emptyText}>No items in inventory yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSku}>{item.sku || 'No SKU'}</Text>
                <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
              </View>
              
              <View style={styles.itemSide}>
                <View style={[
                  styles.stockBadge, 
                  { backgroundColor: item.stock <= 5 ? '#fef2f2' : '#ecfdf5' }
                ]}>
                  <Text style={[
                    styles.stockText, 
                    { color: item.stock <= 5 ? '#ef4444' : '#10b981' }
                  ]}>
                    Qty: {item.stock}
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                    <EditIcon color="#64748b" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                    <TrashIcon color="#ef4444" size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  headerCard: {
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formLabel: { fontSize: 10, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: 6 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    color: '#1e293b'
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 10
  },
  saveButtonText: { color: 'white', fontWeight: 'bold' },

  itemCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemMain: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  itemSku: { fontSize: 11, color: '#94a3b8', marginVertical: 4 },
  itemPrice: { fontSize: 14, fontWeight: '900', color: '#334155' },
  itemSide: { alignItems: 'flex-end', justifyContent: 'space-between' },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  stockText: { fontSize: 10, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  emptyContainer: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', marginTop: 10 }
});