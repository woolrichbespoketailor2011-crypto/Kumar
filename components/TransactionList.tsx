
import React, { useState } from 'react';
import { Transaction, TransactionType, CategoryState } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import AddTransactionModal from './AddTransactionModal';

// Extend jsPDF for autotable type support if needed, 
// though direct usage usually works with 'any' or proper casting in ESM.
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate: (transaction: Transaction) => void;
  categories: CategoryState;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onUpdate, categories }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [groupBy, setGroupBy] = useState<'NONE' | 'DATE' | 'CATEGORY'>('NONE');

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'ALL' || t.type === filterType;
    const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
    
    // Normalize dates to start of day for accurate comparison
    const tDate = new Date(t.date);
    tDate.setHours(0, 0, 0, 0);
    
    const sDate = startDate ? new Date(startDate) : null;
    if (sDate) sDate.setHours(0, 0, 0, 0);
    
    const eDate = endDate ? new Date(endDate) : null;
    if (eDate) eDate.setHours(0, 0, 0, 0);

    const matchesStartDate = !sDate || tDate >= sDate;
    const matchesEndDate = !eDate || tDate <= eDate;
    
    return matchesType && matchesCategory && matchesStartDate && matchesEndDate;
  });

  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category))).sort();

  const getGroupedTransactions = () => {
    if (groupBy === 'NONE') return { 'All Transactions': filteredTransactions };

    const groups: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(t => {
      let key = '';
      if (groupBy === 'DATE') {
        key = new Date(t.date).toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } else if (groupBy === 'CATEGORY') {
        key = t.category;
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    // Sort keys for consistent display
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === 'DATE') {
        return new Date(b).getTime() - new Date(a).getTime();
      }
      return a.localeCompare(b);
    });

    const sortedGroups: { [key: string]: Transaction[] } = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  };

  const groupedTransactions = getGroupedTransactions();

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Note', 'Amount'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type === TransactionType.INCOME ? 'Received' : 'Expand',
      t.category,
      t.note || '',
      t.amount.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const data = filteredTransactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString(),
      Type: t.type === TransactionType.INCOME ? 'Received' : 'Expand',
      Category: t.category,
      Note: t.note || '',
      Amount: t.amount
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['Date', 'Type', 'Category', 'Note', 'Amount'];
    const tableRows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type === TransactionType.INCOME ? 'Received' : 'Expand',
      t.category,
      t.note || '',
      `$${t.amount.toLocaleString()}`
    ]);

    doc.setFontSize(18);
    doc.text('FinTrack Transaction Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillStyle: 'f', fillColor: [0, 113, 227] }
    });

    doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-black/5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-xs font-bold text-black/40 uppercase tracking-wider">Filter Transactions</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-black/50 uppercase ml-1">Date Range</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-2 py-1.5 bg-[#f5f5f7] border border-black/5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0071e3]/30 transition-all"
              />
              <span className="text-black/30 text-xs">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-2 py-1.5 bg-[#f5f5f7] border border-black/5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0071e3]/30 transition-all"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-black/50 uppercase ml-1">Transaction Type</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-2 py-1.5 bg-[#f5f5f7] border border-black/5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0071e3]/30 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value={TransactionType.INCOME}>Income (Received)</option>
              <option value={TransactionType.EXPENSE}>Expense (Expand)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-black/50 uppercase ml-1">Category</label>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-2 py-1.5 bg-[#f5f5f7] border border-black/5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0071e3]/30 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Group By */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-black/50 uppercase ml-1">Group By</label>
            <select 
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="w-full px-2 py-1.5 bg-[#f5f5f7] border border-black/5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0071e3]/30 transition-all appearance-none cursor-pointer"
            >
              <option value="NONE">No Grouping</option>
              <option value="DATE">Date</option>
              <option value="CATEGORY">Category</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button 
              onClick={() => {
                setFilterType('ALL');
                setFilterCategory('ALL');
                setStartDate('');
                setEndDate('');
                setGroupBy('NONE');
              }}
              className="w-full px-3 py-1.5 bg-black/5 hover:bg-black/10 text-black/60 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/50 p-3 rounded-2xl border border-black/5">
        <div className="flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
           </svg>
           <span className="text-xs font-bold text-black/40 uppercase tracking-wider">Export {filteredTransactions.length} Records</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-black/10 hover:bg-black/5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            CSV
          </button>
          <button 
            onClick={exportToExcel}
            disabled={filteredTransactions.length === 0}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-black/10 hover:bg-black/5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            Excel
          </button>
          <button 
            onClick={exportToPDF}
            disabled={filteredTransactions.length === 0}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-black/10 hover:bg-black/5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-[#fcfcfd] border-b border-black/5">
                <th className="px-6 py-4 text-[13px] font-semibold text-black/50">Date</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-black/50">Type</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-black/50">Category</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-black/50">Note</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-black/50 text-right">Amount</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-black/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {Object.keys(groupedTransactions).length > 0 ? (
                Object.entries(groupedTransactions).map(([groupName, groupItems]) => (
                  <React.Fragment key={groupName}>
                    {groupBy !== 'NONE' && (
                      <tr className="bg-black/[0.03] border-y border-black/5">
                        <td colSpan={6} className="px-6 py-2 text-[11px] font-bold text-black/40 uppercase tracking-widest">
                          {groupName} • {groupItems.length} {groupItems.length === 1 ? 'Record' : 'Records'}
                        </td>
                      </tr>
                    )}
                    {groupItems.map((t) => (
                      <tr key={t.id} className="hover:bg-black/[0.02] transition-colors group">
                        <td className="px-6 py-4 text-sm tabular-nums text-black/70">
                          {new Date(t.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight ${
                            t.type === TransactionType.INCOME 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                          }`}>
                            {t.type === TransactionType.INCOME ? 'Received' : 'Expand'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{t.category}</td>
                        <td className="px-6 py-4 text-sm text-black/50 italic truncate max-w-[200px]">
                          {t.note || '-'}
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold text-right tabular-nums ${
                          t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => setEditingTransaction(t)}
                              className="p-2 text-black/20 hover:text-[#0071e3] transition-colors md:opacity-0 group-hover:opacity-100"
                              title="Edit transaction"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => onDelete(t.id)}
                              className="p-2 text-black/20 hover:text-red-500 transition-colors md:opacity-0 group-hover:opacity-100"
                              title="Delete transaction"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-black/30">
                    <p>No transactions found. Click "Add Record" to start.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTransaction && (
        <AddTransactionModal 
          categories={categories}
          editingTransaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSubmit={(data) => {
            onUpdate({ ...data, id: editingTransaction.id });
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
};

export default TransactionList;
