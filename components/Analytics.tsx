import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  FlatList,
  Alert
} from 'react-native';
// Note: You may need to install react-native-chart-kit for the graph
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { 
  FileText as TagIcon, 
  BarChart2 as ChartIcon, 
  Edit3 as EditIcon, 
  Trash2 as TrashIcon,
  Search,
  Calendar,
  ChevronDown
} from 'lucide-react-native';
import type { SavedInvoice } from '../types';

interface Props {
  history: SavedInvoice[];
  themeColor: string;
  onEditInvoice: (invoice: SavedInvoice) => void;
  onDeleteInvoice: (invoice: SavedInvoice) => void;
}

const screenWidth = Dimensions.get("window").width;

export const Analytics: React.FC<Props> = ({ history, themeColor, onEditInvoice, onDeleteInvoice }) => {
  const [subTab, setSubTab] = useState<'records' | 'insights'>('records');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = 
        item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const balance = item.totalAmount - (item.amountPaid || 0);
      const isPaid = balance <= 0;
      const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'paid' ? isPaid : !isPaid;
      
      return matchesSearch && matchesStatus;
    });
  }, [history, searchQuery, statusFilter]);

  // Analytics Calculations
  const totalRevenue = history.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalReceived = history.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const totalOutstanding = totalRevenue - totalReceived;
  const displayCurrency = history[0]?.currency || '₦';

  const chartData = useMemo(() => {
    if (history.length === 0) return { labels: ["None"], datasets: [{ data: [0] }] };
    
    const groups: Record<string, number> = {};
    history.slice(-6).forEach(inv => { // Last 6 invoices for mobile clarity
      const label = inv.invoiceNumber.slice(-3);
      groups[label] = (groups[label] || 0) + inv.totalAmount;
    });

    return {
      labels: Object.keys(groups),
      datasets: [{ data: Object.values(groups) }]
    };
  }, [history]);

  return (
    <View style={styles.container}>
      {/* Sub Tab Navigation */}
      <View style={styles.subTabNav}>
        <TouchableOpacity 
          onPress={() => setSubTab('records')}
          style={[styles.subTabBtn, subTab === 'records' && styles.subTabActive]}
        >
          <TagIcon size={16} color={subTab === 'records' ? '#0f172a' : '#94a3b8'} />
          <Text style={[styles.subTabText, subTab === 'records' && styles.subTabActiveText]}>Invoices</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setSubTab('insights')}
          style={[styles.subTabBtn, subTab === 'insights' && styles.subTabActive]}
        >
          <ChartIcon size={16} color={subTab === 'insights' ? '#0f172a' : '#94a3b8'} />
          <Text style={[styles.subTabText, subTab === 'insights' && styles.subTabActiveText]}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {subTab === 'records' ? (
        <View style={{ flex: 1 }}>
          <View style={styles.filterSection}>
            <View style={styles.searchBar}>
              <Search size={18} color="#94a3b8" />
              <TextInput 
                placeholder="Search client or invoice..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>
            <TouchableOpacity 
               style={styles.filterPicker}
               onPress={() => {
                 Alert.alert("Filter Status", "Select a status", [
                   { text: "All", onPress: () => setStatusFilter('all') },
                   { text: "Paid", onPress: () => setStatusFilter('paid') },
                   { text: "Unpaid", onPress: () => setStatusFilter('unpaid') },
                 ])
               }}
            >
              <Text style={styles.filterPickerText}>Status: {statusFilter.toUpperCase()}</Text>
              <ChevronDown size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <FlatList 
            data={filteredHistory}
            keyExtractor={(item) => item.invoiceNumber}
            renderItem={({ item }) => {
              const balance = item.totalAmount - (item.amountPaid || 0);
              const isPaid = balance <= 0;
              return (
                <View style={styles.invoiceCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.clientName}>{item.clientName}</Text>
                      <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.unpaidBadge]}>
                        <Text style={[styles.statusText, isPaid ? styles.paidText : styles.unpaidText]}>
                          {isPaid ? 'PAID' : 'UNPAID'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardSubText}>#{item.invoiceNumber} • {item.date}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Text style={styles.cardPrice}>{displayCurrency}{item.totalAmount.toLocaleString()}</Text>
                    <View style={styles.iconGroup}>
                      <TouchableOpacity onPress={() => onEditInvoice(item)} style={styles.iconBtn}>
                        <EditIcon size={18} color="#94a3b8" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onDeleteInvoice(item)} style={styles.iconBtn}>
                        <TrashIcon size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      ) : (
        <ScrollView style={styles.insightsScroll}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Sales</Text>
              <Text style={[styles.statValue, { color: themeColor }]}>{displayCurrency}{totalRevenue.toLocaleString()}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Collected</Text>
              <Text style={[styles.statValue, { color: '#10b981' }]}>{displayCurrency}{totalReceived.toLocaleString()}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Outstanding</Text>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>{displayCurrency}{totalOutstanding.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Recent Performance</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => themeColor,
                labelColor: (opacity = 1) => `#94a3b8`,
                propsForDots: { r: "6", strokeWidth: "2", stroke: themeColor }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 60 },
  subTabNav: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    margin: 16,
    padding: 4,
    borderRadius: 12,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8
  },
  subTabActive: { backgroundColor: '#fff', elevation: 2 },
  subTabText: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  subTabActiveText: { color: '#0f172a' },
  
  filterSection: { paddingHorizontal: 16, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 14 },
  filterPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  filterPickerText: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  invoiceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  clientName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  paidBadge: { backgroundColor: '#ecfdf5' },
  unpaidBadge: { backgroundColor: '#fef2f2' },
  statusText: { fontSize: 8, fontWeight: '900' },
  paidText: { color: '#10b981' },
  unpaidText: { color: '#ef4444' },
  cardSubText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  cardActions: { alignItems: 'flex-end', justifyContent: 'space-between' },
  cardPrice: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  iconGroup: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },

  insightsScroll: { padding: 16 },
  statsGrid: { gap: 12, marginBottom: 24 },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1
  },
  statLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '900' },
  chartContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 24, marginBottom: 40 },
  chartTitle: { fontSize: 12, fontWeight: '900', color: '#1e293b', marginBottom: 16, textTransform: 'uppercase' },
  chart: { marginVertical: 8, borderRadius: 16 }
});