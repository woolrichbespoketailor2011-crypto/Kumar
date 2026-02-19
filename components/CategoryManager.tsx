
import React, { useState } from 'react';
import { TransactionType, CategoryState } from '../types';

interface CategoryManagerProps {
  categories: CategoryState;
  onUpdate: (newCategories: CategoryState) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onUpdate }) => {
  const [newCatName, setNewCatName] = useState('');
  const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.EXPENSE);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    if (categories[activeTab].includes(name)) return;

    const updated = {
      ...categories,
      [activeTab]: [...categories[activeTab], name]
    };
    onUpdate(updated);
    setNewCatName('');
  };

  const handleDeleteCategory = (cat: string) => {
    const updated = {
      ...categories,
      [activeTab]: categories[activeTab].filter(c => c !== cat)
    };
    onUpdate(updated);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/5">
        <h2 className="text-xl font-bold mb-6">Manage Categories</h2>

        {/* Tab Switcher */}
        <div className="flex bg-black/5 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab(TransactionType.EXPENSE)}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === TransactionType.EXPENSE ? 'bg-white shadow-sm text-red-600' : 'text-black/40'
            }`}
          >
            Expand Categories
          </button>
          <button
            onClick={() => setActiveTab(TransactionType.INCOME)}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === TransactionType.INCOME ? 'bg-white shadow-sm text-green-600' : 'text-black/40'
            }`}
          >
            Received Categories
          </button>
        </div>

        {/* Add Form */}
        <form onSubmit={handleAddCategory} className="flex gap-2 mb-8">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder={`New ${activeTab === TransactionType.INCOME ? 'Income' : 'Expense'} category...`}
            className="flex-1 px-4 py-2 bg-[#f5f5f7] border border-black/5 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3] focus:border-transparent outline-none transition-all"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            Add
          </button>
        </form>

        {/* Category List */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-black/40 uppercase mb-4 tracking-wider">Active Categories</p>
          <div className="grid grid-cols-1 gap-2">
            {categories[activeTab].map((cat) => (
              <div 
                key={cat} 
                className="flex items-center justify-between px-4 py-3 bg-[#fcfcfd] border border-black/5 rounded-xl hover:border-black/10 transition-colors group"
              >
                <span className="text-sm font-medium">{cat}</span>
                <button 
                  onClick={() => handleDeleteCategory(cat)}
                  className="p-1.5 text-black/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Category"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            {categories[activeTab].length === 0 && (
              <p className="text-center py-8 text-sm text-black/30">No categories defined.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
