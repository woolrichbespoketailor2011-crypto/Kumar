
import React, { useState } from 'react';
import { Transaction, TransactionType, CategoryState } from '../types';

interface AddTransactionModalProps {
  onClose: () => void;
  onSubmit: (t: Omit<Transaction, 'id'>) => void;
  categories: CategoryState;
  editingTransaction?: Transaction;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onClose, onSubmit, categories, editingTransaction }) => {
  const [type, setType] = useState<TransactionType>(editingTransaction?.type || TransactionType.EXPENSE);
  const [amount, setAmount] = useState(editingTransaction?.amount.toString() || '');
  const [category, setCategory] = useState(editingTransaction?.category || '');
  const [date, setDate] = useState(editingTransaction?.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(editingTransaction?.note || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;

    onSubmit({
      type,
      amount: parseFloat(amount),
      category,
      date,
      note
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#f5f5f7] w-full max-w-md rounded-2xl shadow-2xl border border-black/10 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-black/5">
          <h2 className="font-semibold">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-40" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex bg-black/5 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setType(TransactionType.EXPENSE);
                setCategory('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-red-600' : 'text-black/40'
              }`}
            >
              Expand (Expense)
            </button>
            <button
              type="button"
              onClick={() => {
                setType(TransactionType.INCOME);
                setCategory('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                type === TransactionType.INCOME ? 'bg-white shadow-sm text-green-600' : 'text-black/40'
              }`}
            >
              Received (Income)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-black/40 uppercase ml-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3] focus:border-transparent outline-none transition-all"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-black/40 uppercase ml-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3] focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-black/40 uppercase ml-1">Category</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3] focus:border-transparent outline-none transition-all"
            >
              <option value="">Select Category</option>
              {categories[type].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-black/40 uppercase ml-1">Note (Optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3] focus:border-transparent outline-none transition-all resize-none"
              placeholder="Add a description..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            {editingTransaction ? 'Save Changes' : `Create ${type === TransactionType.INCOME ? 'Received' : 'Expand'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
